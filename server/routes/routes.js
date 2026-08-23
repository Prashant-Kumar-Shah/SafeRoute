const express = require('express');
const { protect } = require('../middleware/auth');
const { getRoutes, extractCoords, geocode } = require('../services/osrmService');
const { scoreRoute, getScoreLabel, getScoreExplanation } = require('../services/safetyScoring');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { origin, destination, originCoords, destCoords } = req.body;

    console.log('\n');
    console.log('========================================');
    console.log('🛣️ NEW SAFEROUTE REQUEST');
    console.log('========================================');
    console.log('Origin:', origin);
    console.log('Destination:', destination);

    let oLat, oLng, dLat, dLng, originName, destName;

    if (originCoords && Number.isFinite(Number(originCoords.lat)) && Number.isFinite(Number(originCoords.lng))) {
      oLat = Number(originCoords.lat);
      oLng = Number(originCoords.lng);
      originName = typeof origin === 'string' && origin.trim() ? origin.trim() : `${oLat.toFixed(5)}, ${oLng.toFixed(5)}`;
      console.log(`📍 Origin coordinates received directly: ${oLat}, ${oLng}`);
    } else if (typeof origin === 'string' && origin.trim().length > 0) {
      console.log(`🔎 Geocoding origin: "${origin.trim()}"`);
      const result = await geocode(origin.trim());

      if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lng))) {
        throw new Error('Location not found for the starting point.');
      }

      oLat = Number(result.lat);
      oLng = Number(result.lng);
      originName = result.displayName || origin.trim();
      console.log(`✅ Origin found: ${originName}`);
      console.log(`📍 Origin coordinates: ${oLat}, ${oLng}`);
    } else {
      return res.status(400).json({ success: false, message: 'Provide a starting point or starting coordinates.' });
    }

    if (destCoords && Number.isFinite(Number(destCoords.lat)) && Number.isFinite(Number(destCoords.lng))) {
      dLat = Number(destCoords.lat);
      dLng = Number(destCoords.lng);
      destName = typeof destination === 'string' && destination.trim() ? destination.trim() : `${dLat.toFixed(5)}, ${dLng.toFixed(5)}`;
      console.log(`📍 Destination coordinates received directly: ${dLat}, ${dLng}`);
    } else if (typeof destination === 'string' && destination.trim().length > 0) {
      console.log(`🔎 Geocoding destination: "${destination.trim()}"`);
      const result = await geocode(destination.trim());

      if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lng))) {
        throw new Error('Location not found for the destination.');
      }

      dLat = Number(result.lat);
      dLng = Number(result.lng);
      destName = result.displayName || destination.trim();
      console.log(`✅ Destination found: ${destName}`);
      console.log(`📍 Destination coordinates: ${dLat}, ${dLng}`);
    } else {
      return res.status(400).json({ success: false, message: 'Provide a destination or destination coordinates.' });
    }

    if (!Number.isFinite(oLat) || !Number.isFinite(oLng) || !Number.isFinite(dLat) || !Number.isFinite(dLng)) {
      return res.status(400).json({ success: false, message: 'Invalid location coordinates.' });
    }

    const sameLocation = Math.abs(oLat - dLat) < 0.00001 && Math.abs(oLng - dLng) < 0.00001;

    if (sameLocation) {
      return res.status(400).json({
        success: false,
        message: 'Starting point and destination cannot be the same location.',
      });
    }

    console.log('\n');
    console.log('📍 FINAL COORDINATES');
    console.log(`Origin:      ${oLng}, ${oLat}`);
    console.log(`Destination: ${dLng}, ${dLat}`);

    console.log('\n');
    console.log('🗺️ REQUESTING GENUINE OSRM ALTERNATIVE ROUTES...');

    const osrmRoutes = await getRoutes(oLng, oLat, dLng, dLat);

    if (!Array.isArray(osrmRoutes) || osrmRoutes.length === 0) {
      throw new Error('No routes found between these locations.');
    }

    console.log(`🛣️ OSRM returned ${osrmRoutes.length} route(s).`);

    const uniqueOSRMRoutes = [];
    const routeSignatures = new Set();

    for (const route of osrmRoutes) {
      if (!route) continue;

      const coordinates = extractCoords(route);
      if (!Array.isArray(coordinates) || coordinates.length < 2) continue;

      const first = coordinates[0];
      const middle = coordinates[Math.floor(coordinates.length / 2)];
      const last = coordinates[coordinates.length - 1];

      const signature = [
        first?.[0]?.toFixed?.(5),
        first?.[1]?.toFixed?.(5),
        middle?.[0]?.toFixed?.(5),
        middle?.[1]?.toFixed?.(5),
        last?.[0]?.toFixed?.(5),
        last?.[1]?.toFixed?.(5),
        Math.round(route.distance || 0),
        Math.round(route.duration || 0),
      ].join('|');

      if (!routeSignatures.has(signature)) {
        routeSignatures.add(signature);
        uniqueOSRMRoutes.push(route);
      }
    }

    if (uniqueOSRMRoutes.length === 0) {
      throw new Error('OSRM returned routes without valid geometry.');
    }

    console.log(`🛣️ ${uniqueOSRMRoutes.length} unique route(s) available for scoring.`);

    const hour = new Date().getHours();
    console.log(`🕐 Current hour for safety scoring: ${hour}`);

    const scoredRoutes = await Promise.all(
      uniqueOSRMRoutes.map(async (route, index) => {
        const coords = extractCoords(route);

        if (!Array.isArray(coords) || coords.length < 2) {
          throw new Error(`Route ${index + 1} has invalid geometry.`);
        }

        const rawSafetyScore = await scoreRoute(coords, route.legs, hour);
        const safetyScore = Number(rawSafetyScore);

        if (!Number.isFinite(safetyScore)) {
          throw new Error(`Invalid safety score generated for route ${index + 1}.`);
        }

        const { label, color } = getScoreLabel(safetyScore);
        const scoreBreakdown = await getScoreExplanation(coords, route.legs, hour);

        const distanceMeters = Number(route.distance || 0);
        const distanceKm = distanceMeters / 1000;
        const durationSeconds = Number(route.duration || 0);
        const durationMin = Math.ceil(durationSeconds / 60);
        const routeId = `route_${index + 1}`;

        const scoredRoute = {
          id: routeId,
          geometry: route.geometry,
          distance: distanceMeters,
          duration: durationSeconds,
          distanceKm: Number(distanceKm.toFixed(1)),
          durationMin,
          safetyScore: Number(Math.max(0, Math.min(10, safetyScore)).toFixed(1)),
          safetyLabel: label,
          safetyColor: color,
          scoreBreakdown,
          summary: route.legs?.[0]?.summary || `Alternative route ${index + 1}`,
        };

        console.log('\n');
        console.log(`🛣️ ROUTE ${index + 1}`);
        console.log(`   ID: ${scoredRoute.id}`);
        console.log(`   Distance: ${scoredRoute.distanceKm} km`);
        console.log(`   Duration: ${scoredRoute.durationMin} min`);
        console.log(`   Safety: ${scoredRoute.safetyScore}/10`);
        console.log(`   Rating: ${scoredRoute.safetyLabel}`);
        console.log(`   Geometry points: ${coords.length}`);

        return scoredRoute;
      })
    );

    const safest = scoredRoutes.reduce(
      (best, route) => route.safetyScore > best.safetyScore ? route : best,
      scoredRoutes[0]
    );

    const fastest = scoredRoutes.reduce(
      (best, route) => route.duration < best.duration ? route : best,
      scoredRoutes[0]
    );

    const routesWithTags = scoredRoutes.map((route) => {
      const isSafest = route.id === safest.id;
      const isFastest = route.id === fastest.id;
      let tag = 'alternative';

      if (isSafest && isFastest) tag = 'safest-fastest';
      else if (isSafest) tag = 'safest';
      else if (isFastest) tag = 'fastest';

      return { ...route, tag };
    });

    const isSameRoute = safest.id === fastest.id;
    const scoreDiff = Number(Math.abs(safest.safetyScore - fastest.safetyScore).toFixed(1));
    const timeDiffMin = Math.abs(safest.durationMin - fastest.durationMin);

    console.log('\n');
    console.log('========================================');
    console.log('🏆 ROUTE ANALYSIS COMPLETE');
    console.log('========================================');
    console.log(`🛡️ SAFEST ROUTE: ${safest.id}`);
    console.log(`   Safety: ${safest.safetyScore}/10`);
    console.log(`   Duration: ${safest.durationMin} min`);
    console.log(`   Distance: ${safest.distanceKm} km`);
    console.log('');
    console.log(`⚡ FASTEST ROUTE: ${fastest.id}`);
    console.log(`   Safety: ${fastest.safetyScore}/10`);
    console.log(`   Duration: ${fastest.durationMin} min`);
    console.log(`   Distance: ${fastest.distanceKm} km`);
    console.log('');
    console.log(`🔄 Same route: ${isSameRoute}`);
    console.log(`📊 Score difference: ${scoreDiff}`);
    console.log(`⏱️ Time difference: ${timeDiffMin} min`);
    console.log(`📦 Sending ${routesWithTags.length} genuine route(s) to frontend`);

    routesWithTags.forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.id} → ${route.tag}`);
    });

    console.log('========================================');

    return res.json({
      success: true,
      origin: { name: originName, lat: oLat, lng: oLng },
      destination: { name: destName, lat: dLat, lng: dLng },
      routes: routesWithTags,
      safest: { ...safest, tag: isSameRoute ? 'safest-fastest' : 'safest' },
      fastest: { ...fastest, tag: isSameRoute ? 'safest-fastest' : 'fastest' },
      isSameRoute,
      scoreDiff,
      timeDiffMin,
      hour,
      routeCount: routesWithTags.length,
    });
  } catch (err) {
    console.error('\n');
    console.error('❌ ROUTE ERROR:', err.message);
    console.error(err.stack);

    if (
      err.message.includes('Location not found') ||
      err.message.includes('No routes found') ||
      err.message.includes('not found')
    ) {
      return res.status(404).json({ success: false, message: err.message });
    }

    if (
      err.message.includes('OSRM') ||
      err.message.includes('routing failed') ||
      err.message.includes('Routing') ||
      err.message.includes('routing service')
    ) {
      return res.status(503).json({
        success: false,
        message: 'Routing service temporarily unavailable. Please try again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to compute routes.',
    });
  }
});

router.get('/geocode', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 3 characters.',
      });
    }

    console.log(`🔎 Geocoding request: "${q.trim()}"`);

    const result = await geocode(q.trim());

    if (!result || !Number.isFinite(Number(result.lat)) || !Number.isFinite(Number(result.lng))) {
      throw new Error('Location not found.');
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('❌ Geocoding error:', err.message);

    return res.status(404).json({
      success: false,
      message: err.message || 'Location not found.',
    });
  }
});

module.exports = router;