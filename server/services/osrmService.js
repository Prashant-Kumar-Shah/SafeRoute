/**
 * osrmService.js
 * SafeRoute OSRM Routing Service
 */

const axios = require('axios');
const KNOWN_LOCATIONS = require('../config/knownLocations');

const OSRM_BASE = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'SafeRoute-App/1.0 (Bhiwandi Safe Route Application)';
const BHIWANDI_VIEWBOX = '72.90,19.40,73.20,19.15';
const MAX_ROUTES = 3;
const OSRM_TIMEOUT_MS = 60000;
const FALLBACK_OSRM_TIMEOUT_MS = 10000;
const NOMINATIM_TIMEOUT_MS = 10000;
const MAX_FALLBACK_REQUESTS = 4;
const MAX_FALLBACK_DISTANCE_RATIO = 1.70;
const MAX_FALLBACK_DURATION_RATIO = 1.85;

// ============================================================
// TEXT HELPERS
// ============================================================

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[.,/()\-_'’]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isValidCoordinate(lat, lng) {
  const latitude = Number(lat), longitude = Number(lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

// ============================================================
// DISTANCE HELPERS
// ============================================================

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDirectDistanceKm(originLng, originLat, destLng, destLat) {
  return haversineDistance(originLat, originLng, destLat, destLng);
}

// ============================================================
// ROUTE VALIDATION / NORMALIZATION
// ============================================================

function isValidRoute(route) {
  if (!route || !route.geometry || route.geometry.type !== 'LineString') return false;
  if (!Array.isArray(route.geometry.coordinates) || route.geometry.coordinates.length < 2) return false;
  if (!Number.isFinite(Number(route.distance)) || !Number.isFinite(Number(route.duration))) return false;
  return true;
}

function normalizeOSRMRoute(route) {
  if (!isValidRoute(route)) return null;

  const coordinates = route.geometry.coordinates.map(coordinate => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return null;
    const lng = Number(coordinate[0]), lat = Number(coordinate[1]);
    return isValidCoordinate(lat, lng) ? [lng, lat] : null;
  }).filter(Boolean);

  if (coordinates.length < 2) return null;

  return {
    ...route,
    distance: Number(route.distance),
    duration: Number(route.duration),
    geometry: { type: 'LineString', coordinates },
    legs: Array.isArray(route.legs) ? route.legs : [],
  };
}

// ============================================================
// ROUTE COMPARISON
// ============================================================

function sampleRouteCoordinates(route, sampleCount = 30) {
  const coordinates = route?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
  if (coordinates.length <= sampleCount) return coordinates;

  const samples = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const fraction = i / (sampleCount - 1);
    const index = Math.round(fraction * (coordinates.length - 1));
    samples.push(coordinates[index]);
  }
  return samples;
}

function minimumDistanceToRoute(coordinate, routeCoordinates) {
  if (!Array.isArray(coordinate) || coordinate.length < 2 || !Array.isArray(routeCoordinates) || routeCoordinates.length === 0) return Infinity;

  const lngA = Number(coordinate[0]), latA = Number(coordinate[1]);
  if (!isValidCoordinate(latA, lngA)) return Infinity;

  let minimum = Infinity;

  for (const point of routeCoordinates) {
    if (!Array.isArray(point) || point.length < 2) continue;

    const lngB = Number(point[0]), latB = Number(point[1]);
    if (!isValidCoordinate(latB, lngB)) continue;

    const distance = haversineDistance(latA, lngA, latB, lngB);
    if (distance < minimum) minimum = distance;
  }

  return minimum;
}

function routesHaveSameGeometry(routeA, routeB) {
  const coordsA = sampleRouteCoordinates(routeA, 30);
  const coordsB = sampleRouteCoordinates(routeB, 30);
  if (!coordsA.length || !coordsB.length) return false;

  let totalAB = 0, maxAB = 0, validAB = 0;

  for (const point of coordsA) {
    const distance = minimumDistanceToRoute(point, coordsB);
    if (!Number.isFinite(distance)) continue;
    totalAB += distance;
    maxAB = Math.max(maxAB, distance);
    validAB += 1;
  }

  let totalBA = 0, maxBA = 0, validBA = 0;

  for (const point of coordsB) {
    const distance = minimumDistanceToRoute(point, coordsA);
    if (!Number.isFinite(distance)) continue;
    totalBA += distance;
    maxBA = Math.max(maxBA, distance);
    validBA += 1;
  }

  if (validAB === 0 || validBA === 0) return false;

  const averageABMetres = (totalAB / validAB) * 1000;
  const averageBAMetres = (totalBA / validBA) * 1000;
  const maxABMetres = maxAB * 1000;
  const maxBAMetres = maxBA * 1000;

  return averageABMetres <= 12 && averageBAMetres <= 12 && maxABMetres <= 40 && maxBAMetres <= 40;
}

function routeMetricsAreAlmostIdentical(routeA, routeB) {
  const distanceA = Number(routeA.distance), distanceB = Number(routeB.distance);
  const durationA = Number(routeA.duration), durationB = Number(routeB.duration);

  if (!Number.isFinite(distanceA) || !Number.isFinite(distanceB) || !Number.isFinite(durationA) || !Number.isFinite(durationB)) return false;

  const distanceDifference = Math.abs(distanceA - distanceB) / Math.max(distanceA, distanceB, 1);
  const durationDifference = Math.abs(durationA - durationB) / Math.max(durationA, durationB, 1);

  return distanceDifference <= 0.005 && durationDifference <= 0.01;
}

function routesAreDuplicate(routeA, routeB) {
  if (!isValidRoute(routeA) || !isValidRoute(routeB)) return false;
  if (!routesHaveSameGeometry(routeA, routeB)) return false;
  return routeMetricsAreAlmostIdentical(routeA, routeB);
}

function addUniqueRoute(routes, route) {
  if (!isValidRoute(route)) return false;

  const duplicate = routes.some(existingRoute => routesAreDuplicate(existingRoute, route));

  if (duplicate) {
    console.log('↔️ Duplicate OSRM route removed.');
    return false;
  }

  routes.push(route);
  return true;
}

// ============================================================
// FALLBACK ROUTE HELPERS
// ============================================================

function isReasonableFallback(route, baselineRoute) {
  if (!baselineRoute || !isValidRoute(route)) return true;

  const baselineDistance = Number(baselineRoute.distance);
  const baselineDuration = Number(baselineRoute.duration);
  const candidateDistance = Number(route.distance);
  const candidateDuration = Number(route.duration);

  if (baselineDistance <= 0 || baselineDuration <= 0 || candidateDistance <= 0 || candidateDuration <= 0) return false;

  const distanceRatio = candidateDistance / baselineDistance;
  const durationRatio = candidateDuration / baselineDuration;

  console.log(`   Fallback ratio: distance=${distanceRatio.toFixed(2)}x, duration=${durationRatio.toFixed(2)}x`);

  return distanceRatio <= MAX_FALLBACK_DISTANCE_RATIO && durationRatio <= MAX_FALLBACK_DURATION_RATIO;
}

function generateViaPointCandidates(originLng, originLat, destLng, destLat) {
  const directDistanceKm = getDirectDistanceKm(originLng, originLat, destLng, destLat);
  if (!Number.isFinite(directDistanceKm) || directDistanceKm < 1) return [];

  const meanLat = ((originLat + destLat) / 2) * (Math.PI / 180);
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = Math.max(1, 111.32 * Math.cos(meanLat));
  const dxKm = (destLng - originLng) * kmPerDegreeLng;
  const dyKm = (destLat - originLat) * kmPerDegreeLat;
  const lengthKm = Math.sqrt(dxKm ** 2 + dyKm ** 2);

  if (!Number.isFinite(lengthKm) || lengthKm <= 0) return [];

  const offsetKm = Math.min(1.25, Math.max(0.25, directDistanceKm * 0.12));
  const perpendicularX = -dyKm / lengthKm;
  const perpendicularY = dxKm / lengthKm;
  const fractions = [0.35, 0.65];
  const candidates = [];

  for (const fraction of fractions) {
    const baseLng = originLng + (destLng - originLng) * fraction;
    const baseLat = originLat + (destLat - originLat) * fraction;

    const positive = {
      lng: baseLng + (perpendicularX * offsetKm) / kmPerDegreeLng,
      lat: baseLat + (perpendicularY * offsetKm) / kmPerDegreeLat,
      side: 'positive',
      fraction,
    };

    const negative = {
      lng: baseLng - (perpendicularX * offsetKm) / kmPerDegreeLng,
      lat: baseLat - (perpendicularY * offsetKm) / kmPerDegreeLat,
      side: 'negative',
      fraction,
    };

    candidates.push(positive, negative);
  }

  return candidates.filter(candidate => {
    const fromOrigin = haversineDistance(originLat, originLng, candidate.lat, candidate.lng);
    const fromDestination = haversineDistance(candidate.lat, candidate.lng, destLat, destLng);

    return fromOrigin >= Math.max(0.25, directDistanceKm * 0.08) &&
      fromDestination >= Math.max(0.25, directDistanceKm * 0.08);
  });
}

function sortRoutesByDuration(routes) {
  return [...routes].sort((a, b) => Number(a.duration) - Number(b.duration));
}

// ============================================================
// PRIMARY OSRM REQUEST
// ============================================================

async function requestOSRM(originLng, originLat, destLng, destLat) {
  if (!isValidCoordinate(originLat, originLng)) {
    throw new Error('Invalid origin coordinates supplied to OSRM.');
  }

  if (!isValidCoordinate(destLat, destLng)) {
    throw new Error('Invalid destination coordinates supplied to OSRM.');
  }

  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;

  console.log('');
  console.log('========================================');
  console.log('🗺️ OSRM PRIMARY ROUTE REQUEST');
  console.log('========================================');
  console.log(`Origin:      ${originLat}, ${originLng}`);
  console.log(`Destination: ${destLat}, ${destLng}`);
  console.log(`URL: ${url}`);

  try {
    const response = await axios.get(url, {
      params: {
        alternatives: true,
        steps: true,
        geometries: 'geojson',
        overview: 'full',
        annotations: false,
      },
      timeout: OSRM_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!response?.data) throw new Error('OSRM returned an empty response.');

    if (response.data.code !== 'Ok') {
      throw new Error(`OSRM error: ${response.data.code || 'Unknown error'}`);
    }

    if (!Array.isArray(response.data.routes)) {
      throw new Error('OSRM response does not contain a routes array.');
    }

    console.log(`🛣️ OSRM primary routes received: ${response.data.routes.length}`);
    return response.data.routes;
  } catch (error) {
    if (error.response) {
      console.error('❌ OSRM HTTP error:', error.response.status);
      console.error('❌ OSRM response:', error.response.data);
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('OSRM routing request timed out.');
    }

    if (error.response?.data?.code) {
      throw new Error(`OSRM error: ${error.response.data.code}`);
    }

    throw error;
  }
}

// ============================================================
// FALLBACK OSRM REQUEST THROUGH A REAL WAYPOINT
// ============================================================

async function requestOSRMViaPoint(originLng, originLat, viaLng, viaLat, destLng, destLat) {
  if (!isValidCoordinate(originLat, originLng) || !isValidCoordinate(viaLat, viaLng) || !isValidCoordinate(destLat, destLng)) return [];

  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${viaLng},${viaLat};${destLng},${destLat}`;

  try {
    const response = await axios.get(url, {
      params: {
        alternatives: true,
        steps: true,
        geometries: 'geojson',
        overview: 'full',
        annotations: false,
        continue_straight: false,
      },
      timeout: FALLBACK_OSRM_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (response?.data?.code !== 'Ok' || !Array.isArray(response.data.routes)) return [];

    return response.data.routes.map(normalizeOSRMRoute).filter(Boolean);
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.warn('⚠️ Fallback OSRM request timed out.');
    } else {
      console.warn(`⚠️ Fallback OSRM request failed: ${error.message}`);
    }
    return [];
  }
}

// ============================================================
// GET ROUTES
// ============================================================

async function getRoutes(originLng, originLat, destLng, destLat) {
  const rawRoutes = await requestOSRM(originLng, originLat, destLng, destLat);
  const uniqueRoutes = [];

  for (const rawRoute of rawRoutes) {
    const route = normalizeOSRMRoute(rawRoute);

    if (!route) {
      console.warn('⚠️ Ignoring invalid OSRM route.');
      continue;
    }

    addUniqueRoute(uniqueRoutes, route);
    if (uniqueRoutes.length >= MAX_ROUTES) break;
  }

  if (uniqueRoutes.length < 2) {
    console.log('');
    console.log('🔄 OSRM returned fewer than 2 distinct routes.');
    console.log('🔎 Trying a few real road corridors through OSRM...');

    const baselineRoute = sortRoutesByDuration(uniqueRoutes)[0] || null;
    const candidates = generateViaPointCandidates(originLng, originLat, destLng, destLat).slice(0, MAX_FALLBACK_REQUESTS);

    if (candidates.length > 0) {
      const fallbackResults = await Promise.allSettled(
        candidates.map(candidate => requestOSRMViaPoint(originLng, originLat, candidate.lng, candidate.lat, destLng, destLat))
      );

      for (let index = 0; index < fallbackResults.length; index += 1) {
        if (uniqueRoutes.length >= MAX_ROUTES) break;

        const result = fallbackResults[index];
        if (result.status !== 'fulfilled') continue;

        for (const candidateRoute of result.value) {
          if (uniqueRoutes.length >= MAX_ROUTES) break;

          if (baselineRoute && !isReasonableFallback(candidateRoute, baselineRoute)) {
            console.log(`⚠️ Fallback candidate ${index + 1} rejected as excessive detour.`);
            continue;
          }

          if (addUniqueRoute(uniqueRoutes, candidateRoute)) {
            console.log(`✅ Genuine fallback route accepted. Total routes: ${uniqueRoutes.length}`);
          }
        }
      }
    }
  }

  if (uniqueRoutes.length === 0) {
    throw new Error('No valid routes found between these locations.');
  }

  const finalRoutes = sortRoutesByDuration(uniqueRoutes).slice(0, MAX_ROUTES);

  console.log('');
  console.log('========================================');
  console.log('🛣️ FINAL OSRM ROUTES');
  console.log('========================================');
  console.log(`Raw OSRM routes:       ${rawRoutes.length}`);
  console.log(`Unique genuine routes: ${uniqueRoutes.length}`);
  console.log(`Routes sent to client: ${finalRoutes.length}`);

  finalRoutes.forEach((route, index) => {
    console.log(`   ${index + 1}. ${(route.distance / 1000).toFixed(2)} km | ${Math.round(route.duration / 60)} min | ${route.geometry.coordinates.length} points`);
  });

  if (finalRoutes.length < 2) {
    console.log('ℹ️ Only ONE genuine practical route was found for this journey.');
    console.log('ℹ️ No duplicate or fake route will be created.');
  }

  console.log('========================================');
  console.log('');

  return finalRoutes;
}

// ============================================================
// EXTRACT COORDINATES
// ============================================================

function extractCoords(route) {
  if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) return [];
  return route.geometry.coordinates;
}

// ============================================================
// KNOWN LOCATION LOOKUP
// ============================================================

function findKnownLocation(query) {
  const normalized = normalizeText(query);
  if (!normalized) return null;

  for (const location of KNOWN_LOCATIONS) {
    const exactMatch = location.aliases.some(alias => normalized === normalizeText(alias));
    if (exactMatch) return location;
  }

  for (const location of KNOWN_LOCATIONS) {
    const partialMatch = location.aliases.some(alias => {
      const normalizedAlias = normalizeText(alias);
      return normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized);
    });

    if (partialMatch) return location;
  }

  return null;
}

// ============================================================
// GEOCODING RESULT SCORING
// ============================================================

function scoreGeocodeResult(item, originalQuery) {
  const query = normalizeText(originalQuery);
  const display = normalizeText(item.display_name);
  const name = normalizeText(item.name);
  const words = query.split(' ').filter(Boolean);

  if (!words.length) return 0;

  let score = 0;

  const matchedWords = words.filter(word => display.includes(word) || name.includes(word)).length;
  score += matchedWords / Math.max(words.length, 1);

  if (display.includes('bhiwandi')) score += 0.35;
  if (display.includes('thane')) score += 0.05;

  if (query.includes('railway') || query.includes('station')) {
    if (item.type === 'station' || item.type === 'railway' || item.class === 'railway' || item.category === 'railway') score += 0.50;
    if (display.includes('station')) score += 0.25;
  }

  if (query.includes('college')) {
    if (display.includes('college')) score += 0.50;
    if (name.includes('college')) score += 0.25;
  }

  if (display.includes('india') || display.includes('maharashtra')) score += 0.05;

  return score;
}

// ============================================================
// NOMINATIM REQUEST
// ============================================================

async function requestNominatim(query) {
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: 'jsonv2',
        limit: 10,
        addressdetails: 1,
        countrycodes: 'in',
        viewbox: BHIWANDI_VIEWBOX,
        bounded: 1,
        dedupe: 1,
      },
      timeout: NOMINATIM_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Nominatim request timed out.');
    }
    throw error;
  }
}

// ============================================================
// GEOCODE LOCATION
// ============================================================

async function geocode(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Location query is required.');
  }

  const originalQuery = query.trim();

  if (!originalQuery) {
    throw new Error('Location query cannot be empty.');
  }

  // 1. Coordinate input
  const coordinateMatch = originalQuery.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);

  if (coordinateMatch) {
    const lat = Number(coordinateMatch[1]);
    const lng = Number(coordinateMatch[2]);

    if (isValidCoordinate(lat, lng)) {
      return { lat, lng, displayName: originalQuery };
    }
  }

  // 2. Known location
  const known = findKnownLocation(originalQuery);

  if (known) {
    console.log(`📍 Known location matched: "${originalQuery}" -> ${known.lat}, ${known.lng}`);
    return { lat: known.lat, lng: known.lng, displayName: known.displayName };
  }

  // 3. Nominatim query variations
  const queries = [
    originalQuery,
    `${originalQuery}, Bhiwandi, Maharashtra, India`,
    `${originalQuery}, Thane, Maharashtra, India`,
    `${originalQuery}, Maharashtra, India`,
    `${originalQuery}, India`,
  ];

  const uniqueQueries = [...new Set(queries)];

  for (const searchQuery of uniqueQueries) {
    console.log(`📍 Geocoding: "${searchQuery}"`);

    try {
      const results = await requestNominatim(searchQuery);

      if (!results.length) {
        console.log(`⚠️ No result for "${searchQuery}"`);
        continue;
      }

      const ranked = [...results].sort((a, b) => scoreGeocodeResult(b, originalQuery) - scoreGeocodeResult(a, originalQuery));

      for (const place of ranked) {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);

        if (!isValidCoordinate(lat, lng)) continue;

        console.log(`✅ Location found: ${place.display_name}`);
        console.log(`📍 Coordinates: ${lat}, ${lng}`);

        return { lat, lng, displayName: place.display_name };
      }
    } catch (error) {
      console.log(`⚠️ Nominatim failed for "${searchQuery}": ${error.message}`);
    }
  }

  // 4. Final partial known-location fallback
  const normalized = normalizeText(originalQuery);

  const partial = KNOWN_LOCATIONS.find(location =>
    location.aliases.some(alias => {
      const normalizedAlias = normalizeText(alias);
      return normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized);
    })
  );

  if (partial) {
    console.log(`📍 Partial known-location match: "${originalQuery}"`);
    return { lat: partial.lat, lng: partial.lng, displayName: partial.displayName };
  }

  throw new Error(`Location not found: "${originalQuery}"`);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = { getRoutes, extractCoords, geocode };