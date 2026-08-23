/**
 * seedIncidents.js
 * ------------------------------------------------------------
 * SafeRoute — Bhiwandi + surrounding areas incident seeder
 *
 * Compatible with:
 *   - Local MongoDB
 *   - MongoDB Atlas
 *   - Future production deployment
 *
 * Uses ONLY the incident types currently supported by
 * server/models/Incident.js:
 *
 *   poor_lighting
 *   theft
 *   harassment
 *   isolated_area
 *   suspicious_activity
 *   road_hazard
 *
 * Usage:
 *
 *   cd server
 *   node scripts/seedIncidents.js
 *
 * IMPORTANT:
 * - MONGODB_URI comes from process.env
 * - Previous seed records are removed ONLY for the seed user
 * - Real community reports are not deleted
 * - GeoJSON coordinates are stored as [longitude, latitude]
 * ------------------------------------------------------------
 */

require('dotenv').config();

const mongoose = require('mongoose');

const Incident = require('../models/Incident');
const User = require('../models/User');

/*
|--------------------------------------------------------------------------
| VALID TYPES
|--------------------------------------------------------------------------
*/

const VALID_INCIDENT_TYPES = [
  'poor_lighting',
  'theft',
  'harassment',
  'isolated_area',
  'suspicious_activity',
  'road_hazard',
];

/*
|--------------------------------------------------------------------------
| VALID SEVERITIES
|--------------------------------------------------------------------------
*/

const VALID_SEVERITIES = [
  'low',
  'medium',
  'high',
];

/*
|--------------------------------------------------------------------------
| BHIWANDI + SURROUNDING AREA INCIDENT DATA
|--------------------------------------------------------------------------
|
| NOTE:
| Some entries are locality/corridor-level safety indicators rather than
| exact incident GPS coordinates. They are intentionally labelled in the
| source/description where appropriate.
|
|--------------------------------------------------------------------------
*/

const SEED_INCIDENTS = [

  // ========================================================================
  // THEFT
  // ========================================================================

  {
    title: 'Chain-Snatching Cluster — Narpoli / Shantinagar',
    type: 'theft',
    severity: 'high',
    lat: 19.2930,
    lng: 73.0455,
    description:
      'Police reporting linked a habitual offender in the Shantinagar area with multiple chain-snatching cases registered under Narpoli Police jurisdiction.',
    source:
      'Free Press Journal — Bhiwandi Crime Reporting',
    confidenceScore: 0.95,
    confirmations: 18,
    affectsGroups: [
      'women',
      'senior_citizens',
      'pedestrians',
    ],
    ageDays: 570,
  },

  {
    title: 'Chain-Snatching Risk — Bhiwandi City',
    type: 'theft',
    severity: 'high',
    lat: 19.2815,
    lng: 73.0505,
    description:
      'Crime reporting has documented repeated chain-snatching activity across Bhiwandi and nearby police jurisdictions.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.90,
    confirmations: 20,
    affectsGroups: [
      'women',
      'senior_citizens',
      'pedestrians',
    ],
    ageDays: 240,
  },

  {
    title: 'Chain-Snatching Risk — Narpoli',
    type: 'theft',
    severity: 'high',
    lat: 19.2880,
    lng: 73.0440,
    description:
      'The Narpoli area has appeared in crime reporting involving recurring street-theft and chain-snatching investigations.',
    source:
      'Thane Crime Branch Reporting',
    confidenceScore: 0.86,
    confirmations: 8,
    affectsGroups: [
      'women',
      'pedestrians',
    ],
    ageDays: 240,
  },

  {
    title: 'Motorcycle Theft Risk — Bhiwandi',
    type: 'theft',
    severity: 'high',
    lat: 19.2850,
    lng: 73.0525,
    description:
      'Crime investigations have linked motorcycle theft activity to Bhiwandi and neighbouring areas.',
    source:
      'Thane Crime Branch Reporting',
    confidenceScore: 0.91,
    confirmations: 41,
    affectsGroups: [
      'two_wheeler_owners',
      'commuters',
    ],
    ageDays: 137,
  },

  {
    title: 'Motorcycle Theft Risk — Shantinagar',
    type: 'theft',
    severity: 'high',
    lat: 19.2955,
    lng: 73.0465,
    description:
      'Police reporting has identified theft-related activity around Shantinagar and Pirani Pada.',
    source:
      'Bhiwandi Crime Reporting',
    confidenceScore: 0.87,
    confirmations: 7,
    affectsGroups: [
      'two_wheeler_owners',
    ],
    ageDays: 570,
  },

  {
    title: 'Theft Risk — Bhiwandi-Kalyan Corridor',
    type: 'theft',
    severity: 'medium',
    lat: 19.2600,
    lng: 73.0900,
    description:
      'The wider Bhiwandi-Kalyan corridor has recurring theft and street-crime reports.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.80,
    confirmations: 12,
    affectsGroups: [
      'pedestrians',
      'commuters',
      'two_wheeler_owners',
    ],
    ageDays: 160,
  },

  {
    title: 'Chain-Snatching Risk — Kalyan East',
    type: 'theft',
    severity: 'high',
    lat: 19.2470,
    lng: 73.1540,
    description:
      'Chain-snatching incidents have been reported in Kalyan East, particularly affecting pedestrians and elderly residents.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.88,
    confirmations: 2,
    affectsGroups: [
      'women',
      'senior_citizens',
    ],
    ageDays: 280,
  },

  {
    title: 'Chain-Snatching Risk — Ambivli / Kalyan',
    type: 'theft',
    severity: 'high',
    lat: 19.2690,
    lng: 73.1700,
    description:
      'Crime investigations have identified Ambivli and Kalyan as part of wider chain-snatching activity.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.85,
    confirmations: 20,
    affectsGroups: [
      'women',
      'senior_citizens',
      'pedestrians',
    ],
    ageDays: 220,
  },

  {
    title: 'Chain-Snatching Risk — Dombivli',
    type: 'theft',
    severity: 'high',
    lat: 19.2183,
    lng: 73.0868,
    description:
      'A violent chain-snatching case was reported in Dombivli and investigated by local police.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.88,
    confirmations: 9,
    affectsGroups: [
      'women',
      'pedestrians',
    ],
    ageDays: 70,
  },

  {
    title: 'Theft Risk — Bhiwandi Market Area',
    type: 'theft',
    severity: 'medium',
    lat: 19.2820,
    lng: 73.0540,
    description:
      'Busy market areas can present elevated pickpocketing and phone-theft exposure, especially during crowded periods.',
    source:
      'SafeRoute area-risk seed',
    confidenceScore: 0.60,
    confirmations: 2,
    affectsGroups: [
      'pedestrians',
      'students',
      'tourists',
    ],
    ageDays: 20,
  },

  // ========================================================================
  // SUSPICIOUS ACTIVITY
  // ========================================================================

  {
    title: 'Murder Investigation — Vehale Village',
    type: 'suspicious_activity',
    severity: 'high',
    lat: 19.2850,
    lng: 73.0085,
    description:
      'Police investigated a killing involving a worker at a warehouse in Vehale village.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.96,
    confirmations: 1,
    affectsGroups: [
      'warehouse_workers',
      'night_workers',
    ],
    ageDays: 515,
  },

  {
    title: 'Violent Crime — Govind Nagar',
    type: 'suspicious_activity',
    severity: 'high',
    lat: 19.2945,
    lng: 73.0620,
    description:
      'A violent assault resulting in death was reported in the Govind Nagar area after a theft-related dispute.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.96,
    confirmations: 1,
    affectsGroups: [
      'residents',
      'workers',
      'pedestrians',
    ],
    ageDays: 660,
  },

  {
    title: 'Robbery and Murder — Khoni Area',
    type: 'suspicious_activity',
    severity: 'high',
    lat: 19.2640,
    lng: 73.1470,
    description:
      'Police investigated a robbery and murder involving a powerloom worker in the Khoni area.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.96,
    confirmations: 1,
    affectsGroups: [
      'industrial_workers',
      'night_workers',
    ],
    ageDays: 550,
  },

  {
    title: 'Murder Investigation — Pogaon / Pipeline Road',
    type: 'suspicious_activity',
    severity: 'high',
    lat: 19.3480,
    lng: 73.0280,
    description:
      'A driver was reportedly murdered near the Tansa-Vaitarna Pipeline Road close to Pogaon.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.94,
    confirmations: 5,
    affectsGroups: [
      'drivers',
      'night_workers',
    ],
    ageDays: 540,
  },

  {
    title: 'Robbery Risk — Bhiwandi Area',
    type: 'suspicious_activity',
    severity: 'medium',
    lat: 19.2750,
    lng: 73.0650,
    description:
      'The wider Bhiwandi area has experienced robbery-related investigations and police operations.',
    source:
      'Regional Crime Reporting',
    confidenceScore: 0.80,
    confirmations: 4,
    affectsGroups: [
      'residents',
      'shopkeepers',
      'night_workers',
    ],
    ageDays: 460,
  },

  {
    title: 'Suspicious Gathering Risk — Industrial Belt',
    type: 'suspicious_activity',
    severity: 'medium',
    lat: 19.2500,
    lng: 73.0180,
    description:
      'SafeRoute area-level safety point representing reduced visibility and suspicious-activity concerns around low-footfall industrial roads.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.48,
    confirmations: 0,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 8,
  },

  {
    title: 'Suspicious Activity Risk — Warehouse Access Road',
    type: 'suspicious_activity',
    severity: 'medium',
    lat: 19.2350,
    lng: 73.0200,
    description:
      'Low-footfall warehouse access roads can present elevated personal-safety concerns after working hours.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.45,
    confirmations: 0,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 8,
  },

  // ========================================================================
  // ROAD HAZARDS
  // ========================================================================

  {
    title: 'Heavy-Vehicle Accident Hotspot — Anjur Phata',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2975,
    lng: 73.0215,
    description:
      'Anjur Phata has been reported as a road-safety flashpoint involving heavy vehicles, congestion and dangerous traffic conditions.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.97,
    confirmations: 2,
    affectsGroups: [
      'pedestrians',
      'students',
      'cyclists',
      'two_wheeler_riders',
    ],
    ageDays: 260,
  },

  {
    title: 'Heavy-Vehicle Accident Hotspot — Nadi Naka',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2925,
    lng: 73.0355,
    description:
      'The Anjur Phata-Nadi Naka corridor has been reported as an accident and congestion flashpoint with heavy-truck movement.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.97,
    confirmations: 2,
    affectsGroups: [
      'pedestrians',
      'students',
      'cyclists',
      'two_wheeler_riders',
    ],
    ageDays: 260,
  },

  {
    title: 'Fatal Hit-and-Run Risk — Anjurphata-Dapoda Road',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.3000,
    lng: 73.0100,
    description:
      'A fatal collision involving a biker was reported on the Anjurphata-Dapoda road.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.97,
    confirmations: 1,
    affectsGroups: [
      'two_wheeler_riders',
      'students',
      'pedestrians',
    ],
    ageDays: 570,
  },

  {
    title: 'Fatal Truck Collision — Near IGM Hospital',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.29896,
    lng: 73.06710,
    description:
      'A reported truck collision occurred on Bhiwandi-Kalyan Road near Indira Gandhi Memorial Hospital.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.98,
    confirmations: 1,
    affectsGroups: [
      'pedestrians',
      'children',
      'hospital_visitors',
    ],
    ageDays: 405,
  },

  {
    title: 'Fatal Pothole Accident — Temghar',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2765,
    lng: 73.0940,
    description:
      'A reported fatal two-wheeler accident was associated with an uneven or pothole-ridden road section in Temghar.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.99,
    confirmations: 1,
    affectsGroups: [
      'students',
      'two_wheeler_riders',
    ],
    ageDays: 305,
  },

  {
    title: 'Uneven Road Surface — Temghar / Kalyan Road',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2785,
    lng: 73.0895,
    description:
      'Uneven road surfaces in the Temghar-Kalyan Road corridor create additional risk for two-wheelers.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.90,
    confirmations: 1,
    affectsGroups: [
      'two_wheeler_riders',
      'students',
    ],
    ageDays: 305,
  },

  {
    title: 'Heavy-Truck Traffic Risk — Bhiwandi Urban Roads',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2810,
    lng: 73.0450,
    description:
      'Heavy-truck traffic through populated Bhiwandi roads creates elevated risk for pedestrians and two-wheelers.',
    source:
      'Regional Road Safety Reporting',
    confidenceScore: 0.91,
    confirmations: 5,
    affectsGroups: [
      'pedestrians',
      'cyclists',
      'two_wheeler_riders',
    ],
    ageDays: 260,
  },

  

  {
    title: 'Heavy-Traffic Risk — Kalyan Road',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2820,
    lng: 73.0800,
    description:
      'Kalyan Road experiences substantial mixed traffic and heavy commercial movement, creating road-user conflict points.',
    source:
      'SafeRoute area-risk seed',
    confidenceScore: 0.72,
    confirmations: 3,
    affectsGroups: [
      'pedestrians',
      'students',
      'two_wheeler_riders',
    ],
    ageDays: 25,
  },

  {
    title: 'Heavy-Vehicle Risk — Vadape Industrial Corridor',
    type: 'road_hazard',
    severity: 'high',
    lat: 19.2260,
    lng: 73.0160,
    description:
      'Industrial and warehouse traffic creates additional road-safety exposure around the Vadape corridor.',
    source:
      'SafeRoute area-risk seed',
    confidenceScore: 0.72,
    confirmations: 2,
    affectsGroups: [
      'pedestrians',
      'cyclists',
      'two_wheeler_riders',
      'night_workers',
    ],
    ageDays: 20,
  },

  {
    title: 'Heavy-Vehicle Risk — Rahnal Industrial Area',
    type: 'road_hazard',
    severity: 'medium',
    lat: 19.2525,
    lng: 73.0150,
    description:
      'Warehouse access roads in Rahnal experience commercial traffic and limited pedestrian separation.',
    source:
      'SafeRoute area-risk seed',
    confidenceScore: 0.66,
    confirmations: 2,
    affectsGroups: [
      'pedestrians',
      'warehouse_workers',
      'two_wheeler_riders',
    ],
    ageDays: 20,
  },

  // ========================================================================
  // POOR LIGHTING
  // ========================================================================

  {
    title: 'Night Visibility Concern — Anjur Phata',
    type: 'poor_lighting',
    severity: 'medium',
    lat: 19.2980,
    lng: 73.0210,
    description:
      'SafeRoute area-level safety point representing reduced pedestrian visibility during night hours around a busy corridor.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.55,
    confirmations: 0,
    affectsGroups: [
      'pedestrians',
      'night_workers',
    ],
    ageDays: 7,
  },

  {
    title: 'Night Visibility Concern — Nadi Naka',
    type: 'poor_lighting',
    severity: 'medium',
    lat: 19.2920,
    lng: 73.0340,
    description:
      'SafeRoute area-level safety point representing reduced night-time visibility around a heavy-traffic junction.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.55,
    confirmations: 0,
    affectsGroups: [
      'pedestrians',
      'students',
      'night_workers',
    ],
    ageDays: 7,
  },

  {
    title: 'Night Visibility Concern — Warehouse Belt',
    type: 'poor_lighting',
    severity: 'medium',
    lat: 19.2500,
    lng: 73.0150,
    description:
      'SafeRoute area-level safety point representing reduced pedestrian visibility near warehouse access roads.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.50,
    confirmations: 0,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 7,
  },

  {
    title: 'Night Visibility Concern — Kalyan Road',
    type: 'poor_lighting',
    severity: 'medium',
    lat: 19.2780,
    lng: 73.0820,
    description:
      'SafeRoute area-level safety point representing night-time visibility concerns along a busy road corridor.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.50,
    confirmations: 0,
    affectsGroups: [
      'pedestrians',
      'students',
    ],
    ageDays: 7,
  },

  {
    title: 'Poor Lighting Risk — Bhiwandi Market Approach',
    type: 'poor_lighting',
    severity: 'medium',
    lat: 19.2820,
    lng: 73.0540,
    description:
      'SafeRoute area-level safety point representing lower night visibility around market-side lanes.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.50,
    confirmations: 0,
    affectsGroups: [
      'pedestrians',
      'women',
      'students',
    ],
    ageDays: 7,
  },

  // ========================================================================
  // HARASSMENT
  // ========================================================================

  {
    title: 'Personal Safety Concern — Bhiwandi Market Area',
    type: 'harassment',
    severity: 'medium',
    lat: 19.2815,
    lng: 73.0530,
    description:
      'SafeRoute area-level safety point for personal-safety concerns around busy market approaches.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.45,
    confirmations: 0,
    affectsGroups: [
      'women',
      'students',
      'pedestrians',
    ],
    ageDays: 7,
  },

  {
    title: 'Night Personal Safety Concern — Narpoli',
    type: 'harassment',
    severity: 'medium',
    lat: 19.2910,
    lng: 73.0450,
    description:
      'SafeRoute area-level safety point for personal-safety concerns on quieter streets around Narpoli.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.45,
    confirmations: 0,
    affectsGroups: [
      'women',
      'night_workers',
    ],
    ageDays: 7,
  },

  {
    title: 'Personal Safety Concern — Kalyan Road',
    type: 'harassment',
    severity: 'medium',
    lat: 19.2780,
    lng: 73.0800,
    description:
      'SafeRoute area-level safety point for personal-safety concerns along a busy mixed-traffic corridor.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.40,
    confirmations: 0,
    affectsGroups: [
      'women',
      'students',
      'pedestrians',
    ],
    ageDays: 7,
  },

  // ========================================================================
  // ISOLATED AREA
  // ========================================================================

  {
    title: 'Isolated Warehouse Access Road — Rahnal',
    type: 'isolated_area',
    severity: 'medium',
    lat: 19.2525,
    lng: 73.0150,
    description:
      'Warehouse-heavy area with relatively low pedestrian activity outside normal working hours.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.58,
    confirmations: 1,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 10,
  },

  {
    title: 'Isolated Industrial Stretch — Vadape',
    type: 'isolated_area',
    severity: 'medium',
    lat: 19.2260,
    lng: 73.0160,
    description:
      'Industrial and warehouse zone with limited pedestrian activity during late hours.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.58,
    confirmations: 1,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 10,
  },

  {
    title: 'Isolated Industrial Stretch — Kalher',
    type: 'isolated_area',
    severity: 'medium',
    lat: 19.2480,
    lng: 73.0020,
    description:
      'Warehouse and industrial compound area with lower pedestrian activity away from main roads.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.58,
    confirmations: 1,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 10,
  },

  {
    title: 'Isolated Road Risk — Kasheli Industrial Belt',
    type: 'isolated_area',
    severity: 'medium',
    lat: 19.2050,
    lng: 73.0120,
    description:
      'Industrial and warehouse areas around Kasheli can have low pedestrian activity outside business hours.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.55,
    confirmations: 1,
    affectsGroups: [
      'night_workers',
      'warehouse_workers',
    ],
    ageDays: 10,
  },

  {
    title: 'Isolated Corridor — Yevai Naka',
    type: 'isolated_area',
    severity: 'medium',
    lat: 19.2840,
    lng: 73.0150,
    description:
      'Warehouse and logistics access roads around Yevai Naka can become relatively isolated at night.',
    source:
      'SafeRoute inferred area-risk seed',
    confidenceScore: 0.52,
    confirmations: 0,
    affectsGroups: [
      'night_workers',
      'drivers',
    ],
    ageDays: 10,
  },

];

/*
|--------------------------------------------------------------------------
| VALIDATE SEED DATA
|--------------------------------------------------------------------------
*/

function validateSeedData() {

  console.log('');
  console.log(
    `🔍 Validating ${SEED_INCIDENTS.length} incidents...`
  );

  SEED_INCIDENTS.forEach(
    (incident, index) => {

      const number =
        index + 1;

      if (
        !VALID_INCIDENT_TYPES.includes(
          incident.type
        )
      ) {
        throw new Error(
          `Invalid incident type at seed #${number}: ${incident.type}`
        );
      }

      if (
        !VALID_SEVERITIES.includes(
          incident.severity
        )
      ) {
        throw new Error(
          `Invalid severity at seed #${number}: ${incident.severity}`
        );
      }

      if (
        !Number.isFinite(
          Number(incident.lat)
        ) ||
        !Number.isFinite(
          Number(incident.lng)
        )
      ) {
        throw new Error(
          `Invalid coordinates at seed #${number}: ${incident.title}`
        );
      }

      if (
        Number(incident.lat) < -90 ||
        Number(incident.lat) > 90
      ) {
        throw new Error(
          `Invalid latitude at seed #${number}: ${incident.lat}`
        );
      }

      if (
        Number(incident.lng) < -180 ||
        Number(incident.lng) > 180
      ) {
        throw new Error(
          `Invalid longitude at seed #${number}: ${incident.lng}`
        );
      }

      if (
        Number(incident.confidenceScore) < 0 ||
        Number(incident.confidenceScore) > 1
      ) {
        throw new Error(
          `Invalid confidenceScore at seed #${number}`
        );
      }

    }
  );

  console.log(
    '✅ Seed data validation passed'
  );
}

/*
|--------------------------------------------------------------------------
| DATABASE CONNECTION
|--------------------------------------------------------------------------
*/

async function connectDatabase() {

  const MONGODB_URI =
    process.env.MONGODB_URI;

  if (
    !MONGODB_URI ||
    !MONGODB_URI.trim()
  ) {
    throw new Error(
      'MONGODB_URI is missing from server/.env'
    );
  }

  const maskedUri =
    MONGODB_URI.replace(
      /:\/\/([^:]+):([^@]+)@/,
      '://$1:****@'
    );

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    '🔌 CONNECTING TO MONGODB'
  );

  console.log(
    '========================================'
  );

  console.log(
    `URI: ${maskedUri}`
  );

  if (
    MONGODB_URI.startsWith(
      'mongodb+srv://'
    )
  ) {
    console.log(
      '☁️ MongoDB Atlas / hosted MongoDB detected'
    );
  } else {
    console.log(
      '🖥️ Standard MongoDB connection detected'
    );
  }

  await mongoose.connect(
    MONGODB_URI,
    {
      serverSelectionTimeoutMS: 10000,
    }
  );

  console.log(
    '✅ MongoDB connected'
  );

  console.log(
    `📦 Database: ${mongoose.connection.name}`
  );

  console.log(
    '========================================'
  );
}

/*
|--------------------------------------------------------------------------
| FIND OR CREATE SEED USER
|--------------------------------------------------------------------------
*/

async function getSeedUser() {

  const email =
    'seed@saferoute.demo';

  let seedUser =
    await User.findOne({
      email,
    });

  if (!seedUser) {

    seedUser =
      await User.create({
        name:
          'SafeRoute Bhiwandi Seed',

        email,

        password:
          'SafeRoute@2024!',
      });

    console.log(
      '✅ Seed user created'
    );

  } else {

    console.log(
      '✅ Existing seed user found'
    );
  }

  return seedUser;
}

/*
|--------------------------------------------------------------------------
| DELETE PREVIOUS SEED DATA
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Only the seed user's incidents are deleted.
| Real user/community reports remain untouched.
|
|--------------------------------------------------------------------------
*/

async function clearPreviousSeedIncidents(
  seedUser
) {

  const deleted =
    await Incident.deleteMany({
      reportedBy:
        seedUser._id,
    });

  console.log(
    `🗑️ Removed ${deleted.deletedCount} previous seed incidents`
  );
}

/*
|--------------------------------------------------------------------------
| PREPARE INCIDENT DOCUMENTS
|--------------------------------------------------------------------------
*/

function prepareIncidentDocuments(
  seedUser
) {

  return SEED_INCIDENTS.map(
    (incident) => {

      const ageDays =
        Number(
          incident.ageDays || 0
        );

      const reportedDate =
        new Date(
          Date.now() -
          ageDays *
            24 *
            60 *
            60 *
            1000
        );

      /*
       * Do NOT calculate expiresAt from reportedDate.
       *
       * Your schema has a MongoDB TTL index.
       *
       * If we used:
       *
       * reportedDate + 30 days
       *
       * old historical incidents could disappear immediately.
       *
       * Therefore seed records remain available for one year.
       */

      const expiresAt =
        new Date(
          Date.now() +
          365 *
            24 *
            60 *
            60 *
            1000
        );

      return {

        title:
          incident.title,

        type:
          incident.type,

        severity:
          incident.severity,

        description:
          incident.description,

        /*
         * GeoJSON:
         *
         * [longitude, latitude]
         */

        location: {
          type:
            'Point',

          coordinates: [
            Number(
              incident.lng
            ),

            Number(
              incident.lat
            ),
          ],
        },

        reportedBy:
          seedUser._id,

        source:
          incident.source,

        confidenceScore:
          Number(
            incident.confidenceScore
          ),

        confidence:
          Number(
            incident.confidenceScore
          ),

        affectsGroups:
          Array.isArray(
            incident.affectsGroups
          )
            ? incident.affectsGroups
            : [],

        confirmations:
          Number(
            incident.confirmations || 0
          ),

        confirmedBy:
          [],

        reportedAt:
          reportedDate,

        createdAt:
          reportedDate,

        updatedAt:
          reportedDate,

        expiresAt,

        isActive:
          true,
      };
    }
  );
}

/*
|--------------------------------------------------------------------------
| INSERT INCIDENTS
|--------------------------------------------------------------------------
*/

async function insertIncidents(
  documents
) {

  if (
    !documents.length
  ) {
    throw new Error(
      'No incidents available for insertion.'
    );
  }

  return Incident.insertMany(
    documents,
    {
      ordered: true,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRINT SUMMARY
|--------------------------------------------------------------------------
*/

function printSummary(
  inserted
) {

  const typeCounts =
    {};

  const severityCounts =
    {};

  for (
    const incident of inserted
  ) {

    typeCounts[
      incident.type
    ] =
      (
        typeCounts[
          incident.type
        ] || 0
      ) + 1;

    severityCounts[
      incident.severity
    ] =
      (
        severityCounts[
          incident.severity
        ] || 0
      ) + 1;
  }

  console.log('');
  console.log(
    '=============================================='
  );

  console.log(
    '✅ BHIWANDI INCIDENT SEED COMPLETE'
  );

  console.log(
    '=============================================='
  );

  console.log(
    `Total incidents inserted: ${inserted.length}`
  );

  console.log('');
  console.log(
    'Incident types:'
  );

  Object.entries(
    typeCounts
  ).forEach(
    ([type, count]) => {

      console.log(
        `  ${type}: ${count}`
      );
    }
  );

  console.log('');
  console.log(
    'Severity:'
  );

  Object.entries(
    severityCounts
  ).forEach(
    ([severity, count]) => {

      console.log(
        `  ${severity}: ${count}`
      );
    }
  );

  console.log('');
  console.log(
    'Main areas covered:'
  );

  console.log(
    '  • Bhiwandi City'
  );

  console.log(
    '  • Narpoli'
  );

  console.log(
    '  • Shantinagar'
  );

  console.log(
    '  • Govind Nagar'
  );

  console.log(
    '  • Vehale'
  );

  console.log(
    '  • Khoni'
  );

  console.log(
    '  • Anjur Phata'
  );

  console.log(
    '  • Nadi Naka'
  );

  console.log(
    '  • Dapoda'
  );

  console.log(
    '  • Temghar'
  );

  console.log(
    '  • Kalyan Road'
  );

  console.log(
    '  • Rahnal'
  );

  console.log(
    '  • Vadape'
  );

  console.log(
    '  • Kalher'
  );

  console.log(
    '  • Kasheli'
  );

  console.log(
    '  • Yevai Naka'
  );

  console.log(
    '  • Kalyan'
  );

  console.log(
    '  • Ambivli'
  );

  console.log(
    '  • Dombivli'
  );

  console.log(
    '=============================================='
  );
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function seed() {

  try {

    console.log('');
    console.log(
      '=============================================='
    );

    console.log(
      '🛡️ SAFEROUTE INCIDENT SEEDER'
    );

    console.log(
      'Bhiwandi + Surrounding Areas'
    );

    console.log(
      '=============================================='
    );

    /*
     * 1. Validate seed data.
     */

    validateSeedData();

    /*
     * 2. Connect to local or hosted MongoDB.
     */

    await connectDatabase();

    /*
     * 3. Find or create seed user.
     */

    const seedUser =
      await getSeedUser();

    /*
     * 4. Remove previous seed records.
     */

    await clearPreviousSeedIncidents(
      seedUser
    );

    /*
     * 5. Prepare documents.
     */

    const documents =
      prepareIncidentDocuments(
        seedUser
      );

    console.log(
      `📦 Preparing ${documents.length} incidents...`
    );

    /*
     * 6. Insert.
     */

    const inserted =
      await insertIncidents(
        documents
      );

    /*
     * 7. Summary.
     */

    printSummary(
      inserted
    );

    console.log('');
    console.log(
      '🎉 Seed completed successfully.'
    );

  } catch (error) {

    console.error('');
    console.error(
      '=============================================='
    );

    console.error(
      '❌ INCIDENT SEED FAILED'
    );

    console.error(
      '=============================================='
    );

    console.error(
      error.message
    );

    if (
      error.name ===
      'MongooseServerSelectionError'
    ) {

      console.error('');
      console.error(
        'MongoDB could not be reached.'
      );

      console.error(
        'Check whether MongoDB is running locally.'
      );

      console.error(
        'Or verify MONGODB_URI when deployed.'
      );
    }

    console.error(
      '=============================================='
    );

    process.exitCode = 1;

  } finally {

    try {

      if (
        mongoose.connection.readyState !==
        0
      ) {

        await mongoose.connection.close();

        console.log(
          '🔌 MongoDB connection closed'
        );
      }

    } catch (closeError) {

      console.error(
        '⚠️ Failed to close MongoDB connection:',
        closeError.message
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

seed();