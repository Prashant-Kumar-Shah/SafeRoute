const express = require('express');
const router = express.Router();
const localHavens = require('../config/bhiwandiSafeHavens.json');

const SAFE_HAVEN_TYPES = ['police', 'hospital', 'pharmacy', 'fire_station', 'petrol_pump'];

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isValidHaven(haven) {
  if (!haven) return false;

  const lat = Number(haven.lat);
  const lng = Number(haven.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (!haven.id || !haven.name || !haven.type) return false;
  if (!SAFE_HAVEN_TYPES.includes(haven.type)) return false;

  return true;
}

router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required.' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude.' });
    }

    let radius = parseFloat(req.query.radius);
    if (!Number.isFinite(radius) || radius <= 0) radius = 10;
    radius = Math.min(radius, 50);

    console.log('\n========================================');
    console.log('🛡️ SAFE HAVEN REQUEST');
    console.log('========================================');
    console.log(`📍 User location: ${lat}, ${lng}`);
    console.log(`📏 Search radius: ${radius} km`);
    console.log(`📦 Total local records: ${localHavens.length}`);

    const validHavens = localHavens.filter(isValidHaven);
    console.log(`✅ Valid Safe Haven records: ${validHavens.length}`);

    const safeHavensWithDistance = validHavens
      .map((haven) => {
        const distance = getDistanceKm(lat, lng, Number(haven.lat), Number(haven.lng));
        return { ...haven, lat: Number(haven.lat), lng: Number(haven.lng), distanceKm: Number(distance.toFixed(2)) };
      })
      .filter((haven) => haven.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const safeHavens = safeHavensWithDistance.map((haven) => ({
      id: haven.id,
      name: haven.name,
      address: haven.address || '',
      lat: haven.lat,
      lng: haven.lng,
      type: haven.type,
      distanceKm: haven.distanceKm,
    }));

    const counts = {
      police: 0,
      hospital: 0,
      pharmacy: 0,
      fire_station: 0,
      petrol_pump: 0,
    };

    safeHavens.forEach((haven) => {
      if (Object.prototype.hasOwnProperty.call(counts, haven.type)) counts[haven.type] += 1;
    });

    console.log(`✅ Found ${safeHavens.length} Safe Haven(s)`);
    console.log(`   👮 Police: ${counts.police}`);
    console.log(`   🏥 Hospitals: ${counts.hospital}`);
    console.log(`   💊 Pharmacies: ${counts.pharmacy}`);
    console.log(`   🚒 Fire Stations: ${counts.fire_station}`);
    console.log(`   ⛽ Petrol Pumps: ${counts.petrol_pump}`);

    safeHavens.slice(0, 15).forEach((haven, index) => {
      console.log(`   ${index + 1}. ${haven.name} | ${haven.type} | ${haven.distanceKm} km`);
    });

    console.log('========================================\n');

    return res.json({
      success: true,
      location: { lat, lng },
      radiusKm: radius,
      count: safeHavens.length,
      counts,
      safeHavens,
    });
  } catch (err) {
    console.error('❌ Safe havens retrieval failed:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve safe havens.' });
  }
});

router.get('/types', (req, res) => {
  return res.json({
    success: true,
    types: [
      { value: 'police', label: 'Police Stations', icon: '👮' },
      { value: 'hospital', label: 'Hospitals', icon: '🏥' },
      { value: 'pharmacy', label: 'Pharmacies', icon: '💊' },
      { value: 'fire_station', label: 'Fire Stations', icon: '🚒' },
      { value: 'petrol_pump', label: 'Petrol Pumps', icon: '⛽' },
    ],
  });
});

module.exports = router;