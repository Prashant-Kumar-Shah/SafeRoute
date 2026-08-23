/**
 * safetyScoring.js — SafeRoute Safety Scoring Engine
 * Safety score:
 * 40% Community Incident Reports
 * 30% Street Lighting / Road Type
 * 20% Time of Day
 * 10% Road Classification
 * Final score: 0.0 - 10.0
 */

const Incident = require("../models/Incident");

const INCIDENT_RADIUS_METERS = 250;
const INCIDENT_LIFETIME_DAYS = 30;
const MAX_ROUTE_SAMPLES = 80;

const getTimeOfDayScore = (hour) => {
  if (hour >= 6 && hour < 10) return 0.90;
  if (hour >= 10 && hour < 16) return 1.00;
  if (hour >= 16 && hour < 20) return 0.85;
  if (hour >= 20 && hour < 22) return 0.70;
  if (hour >= 22 && hour < 24) return 0.55;
  if (hour >= 0 && hour < 2) return 0.45;
  if (hour >= 2 && hour < 4) return 0.35;
  if (hour >= 4 && hour < 6) return 0.50;
  return 0.80;
};

const getRoadTypeScore = (legs) => {
  if (!Array.isArray(legs) || legs.length === 0) return 0.55;

  const roadTypeWeights = {
    motorway: 0.95,
    trunk: 0.90,
    primary: 0.85,
    secondary: 0.80,
    tertiary: 0.70,
    residential: 0.60,
    service: 0.45,
    footway: 0.30,
    path: 0.25,
    unclassified: 0.50,
    default: 0.55,
  };

  let totalDuration = 0;
  let weightedScore = 0;

  legs.forEach((leg) => {
    if (!Array.isArray(leg.steps)) return;

    leg.steps.forEach((step) => {
      const name = String(step.name || "").toLowerCase();
      let score = roadTypeWeights.default;

      if (
        name.includes("sector") ||
        name.includes("main road") ||
        name.includes("highway") ||
        name.includes("nh ") ||
        name.includes("nh-") ||
        name.includes("marg") ||
        name.includes("station road")
      ) {
        score = roadTypeWeights.primary;
      } else if (
        name.includes("market") ||
        name.includes("chowk") ||
        name.includes("nagar") ||
        name.includes("bazaar") ||
        name.includes("road")
      ) {
        score = roadTypeWeights.secondary;
      } else if (
        name === "" ||
        name.includes("lane") ||
        name.includes("gali") ||
        name.includes("path") ||
        name.includes("footway")
      ) {
        score = roadTypeWeights.footway;
      }

      const duration = Number(step.duration) || 1;
      weightedScore += score * duration;
      totalDuration += duration;
    });
  });

  return totalDuration <= 0 ? 0.55 : weightedScore / totalDuration;
};

const getLightingScore = (roadTypeScore, hour) => {
  const isNight = hour < 6 || hour >= 20;
  if (!isNight) return roadTypeScore;

  const nightPenalty = 0.70;
  return roadTypeScore * nightPenalty + (1 - nightPenalty) * 0.20;
};

const getSeverityMultiplier = (severity) => {
  switch (severity) {
    case "high": return 1.50;
    case "medium": return 1.00;
    case "low": return 0.55;
    default: return 1.00;
  }
};

const getIncidentTypeMultiplier = (type) => {
  switch (type) {
    case "harassment": return 1.50;
    case "theft": return 1.40;
    case "suspicious_activity": return 1.30;
    case "isolated_area": return 1.20;
    case "poor_lighting": return 1.15;
    case "road_hazard": return 1.00;
    default: return 1.00;
  }
};

const getRecencyFactor = (incident) => {
  const date = incident.reportedAt || incident.createdAt;
  if (!date) return 0.5;

  const ageMs = Date.now() - new Date(date).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (!Number.isFinite(ageDays)) return 0.5;
  if (ageDays <= 0) return 1.0;
  if (ageDays >= INCIDENT_LIFETIME_DAYS) return 0;

  return Math.max(0, 1 - ageDays / INCIDENT_LIFETIME_DAYS);
};

const getIncidentConfidence = (incident) => {
  const confidence =
    incident.confidenceScore ??
    incident.confidence ??
    0.5;

  const value = Number(confidence);
  if (!Number.isFinite(value)) return 0.5;

  return Math.max(0, Math.min(1, value));
};

const sampleRouteCoordinates = (routeCoords) => {
  if (!Array.isArray(routeCoords)) return [];

  const validCoords = routeCoords.filter(
    (coord) =>
      Array.isArray(coord) &&
      coord.length >= 2 &&
      Number.isFinite(Number(coord[0])) &&
      Number.isFinite(Number(coord[1]))
  );

  if (validCoords.length <= MAX_ROUTE_SAMPLES) return validCoords;

  const samples = [];
  const step = (validCoords.length - 1) / (MAX_ROUTE_SAMPLES - 1);

  for (let i = 0; i < MAX_ROUTE_SAMPLES; i++) {
    samples.push(validCoords[Math.round(i * step)]);
  }

  return samples;
};

const getIncidentScore = async (routeCoords) => {
  if (!Array.isArray(routeCoords) || routeCoords.length === 0) return 1.0;

  const sampledCoords = sampleRouteCoordinates(routeCoords);
  if (sampledCoords.length === 0) return 1.0;

  const uniqueIncidents = new Map();

  for (const coord of sampledCoords) {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    try {
      const nearbyIncidents = await Incident.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: INCIDENT_RADIUS_METERS,
          },
        },
        isActive: true,
      }).select(
        "_id type severity confidence confidenceScore reportedAt createdAt confirmations"
      );

      for (const incident of nearbyIncidents) {
        const id = incident._id.toString();
        if (!uniqueIncidents.has(id)) {
          uniqueIncidents.set(id, incident);
        }
      }
    } catch (queryError) {
      console.error("Incident query failed:", queryError.message);
    }
  }

  if (uniqueIncidents.size === 0) return 1.0;

  let totalPenalty = 0;

  for (const incident of uniqueIncidents.values()) {
    const confidence = getIncidentConfidence(incident);
    const recency = getRecencyFactor(incident);
    const severity = getSeverityMultiplier(incident.severity);
    const typeMultiplier = getIncidentTypeMultiplier(incident.type);

    const confirmations = Number(incident.confirmations) || 0;
    const confirmationFactor = Math.min(
      1.20,
      1 + confirmations * 0.05
    );

    const incidentPenalty =
      confidence *
      recency *
      severity *
      typeMultiplier *
      confirmationFactor;

    totalPenalty += incidentPenalty;
  }

  const routeLengthFactor = Math.max(1, sampledCoords.length / 10);
  const normalizedPenalty = totalPenalty / routeLengthFactor;

  const score = 1 - Math.min(0.90, normalizedPenalty);

  return Math.max(0.10, Math.min(1.0, score));
};

const scoreRoute = async (routeCoords, legs, hour) => {
  const safeHour = Number.isFinite(Number(hour))
    ? Number(hour)
    : new Date().getHours();

  const [incidentScore, roadTypeScore] = await Promise.all([
    getIncidentScore(routeCoords),
    Promise.resolve(getRoadTypeScore(legs)),
  ]);

  const timeScore = getTimeOfDayScore(safeHour);
  const lightingScore = getLightingScore(roadTypeScore, safeHour);

  const composite =
    0.40 * incidentScore +
    0.30 * lightingScore +
    0.20 * timeScore +
    0.10 * roadTypeScore;

  const finalScore = composite * 10;

  return Math.round(finalScore * 10) / 10;
};

const getScoreLabel = (score) => {
  if (score >= 8.5) {
    return { label: "Very Safe", color: "green" };
  }

  if (score >= 7.0) {
    return { label: "Safe", color: "green" };
  }

  if (score >= 5.5) {
    return { label: "Moderate", color: "yellow" };
  }

  if (score >= 4.0) {
    return { label: "Use Caution", color: "yellow" };
  }

  return { label: "High Risk", color: "red" };
};

const getScoreExplanation = async (routeCoords, legs, hour) => {
  const incidentScore = await getIncidentScore(routeCoords);
  const roadTypeScore = getRoadTypeScore(legs);
  const timeScore = getTimeOfDayScore(hour);
  const lightingScore = getLightingScore(roadTypeScore, hour);
  const isNight = hour < 6 || hour >= 20;

  return {
    incident: {
      score: Math.round(incidentScore * 10) / 10,
      weight: "40%",
      label: "Community Incident Reports",
    },

    lighting: {
      score: Math.round(lightingScore * 10) / 10,
      weight: "30%",
      label: `Street Lighting${
        isNight ? " (night penalty applied)" : ""
      }`,
    },

    timeOfDay: {
      score: Math.round(timeScore * 10) / 10,
      weight: "20%",
      label: `Time of Day (${hour}:00)`,
    },

    roadType: {
      score: Math.round(roadTypeScore * 10) / 10,
      weight: "10%",
      label: "Road Classification",
    },
  };
};

module.exports = {
  scoreRoute,
  getScoreLabel,
  getScoreExplanation,
  getTimeOfDayScore,
};