import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { motion, AnimatePresence } from 'framer-motion';
import { routesAPI, incidentsAPI, safeHavensAPI, feedbackAPI } from '../services/api';
import { useGPS } from '../hooks/useGPS';
import SOSButton from '../components/SOSButton';
import styles from './RouteSearch.module.css';

/* ============================== CONFIGURATION ============================== */

const BHIWANDI_CENTER = [19.2813, 73.0483];
const BHIWANDI_VIEWBOX = '72.90,19.40,73.20,19.15';
const SAFEST_COLOR = '#6bdc96';
const FASTEST_COLOR = '#adc7f7';
const INCIDENT_COLOR = '#ffb866';
const DESTINATION_COLOR = '#ff5f6d';

/* ======================= INCIDENT MARKER CONFIGURATION ======================= */

const INCIDENT_MARKER_CONFIG = {
  poor_lighting: { icon: '💡', color: '#ffd166', label: 'Poor Lighting' },
  theft: { icon: '💰', color: '#ff9f43', label: 'Theft / Robbery' },
  harassment: { icon: '🛑', color: '#ff5f6d', label: 'Harassment' },
  suspicious_activity: { icon: '👁️', color: '#b58cff', label: 'Suspicious Activity' },
  isolated_area: { icon: '🌑', color: '#7aa7ff', label: 'Isolated Area' },
  road_hazard: { icon: '🚧', color: '#ffb866', label: 'Road Hazard' },
};

function getIncidentConfig(type) {
  return INCIDENT_MARKER_CONFIG[type] || INCIDENT_MARKER_CONFIG.suspicious_activity;
}

function createIncidentIcon(type, severity = 'medium') {
  const config = getIncidentConfig(type);
  const size = severity === 'high' ? 30 : severity === 'low' ? 23 : 26;
  return L.divIcon({
    className: 'saferoute-incident-marker',
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(11,19,38,0.96);
        border:2px solid ${config.color};display:flex;align-items:center;justify-content:center;
        font-size:${Math.max(11, size - 12)}px;
        box-shadow:0 0 0 2px ${config.color}22,0 4px 12px rgba(0,0,0,0.42),0 0 12px ${config.color}55;
        cursor:pointer;">${config.icon}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function createIncidentClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count >= 50 ? 56 : count >= 20 ? 50 : count >= 10 ? 44 : 38;
  return L.divIcon({
    className: 'saferoute-incident-cluster',
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;
        background:radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(11,19,38,0.98) 48%, rgba(11,19,38,0.98) 100%);
        border:3px solid #ffb866;display:flex;align-items:center;justify-content:center;color:#ffffff;
        font-weight:800;font-size:${count >= 100 ? 12 : 14}px;
        box-shadow:0 0 0 4px rgba(255,184,102,0.10),0 6px 18px rgba(0,0,0,0.42),0 0 18px rgba(255,184,102,0.45);">
        ${count}
      </div>
    `,
    iconSize: [size, size],
  });
}

/* ======================= SAFE HAVEN MARKER CONFIGURATION ======================= */

function getSafeHavenConfig(type) {
  const normalizedType = String(type || '').toLowerCase();
  if (normalizedType === 'police') return { icon: '👮', color: '#7eb4ff', label: 'Police Station' };
  if (normalizedType === 'petrol_pump') return { icon: '⛽', color: '#ffb84d', label: 'Petrol Pump' };
  if (normalizedType === 'hospital') return { icon: '🏥', color: '#6bdc96', label: 'Hospital' };
  if (normalizedType === 'fire') return { icon: '🚒', color: '#ff6f61', label: 'Fire Station' };
  if (normalizedType === 'pharmacy') return { icon: '💊', color: '#65e6d2', label: 'Pharmacy' };
  return { icon: '🛡️', color: '#65e6d2', label: 'Safe Haven' };
}

function createSafeHavenIcon(type) {
  const config = getSafeHavenConfig(type);
  return L.divIcon({
    className: 'saferoute-safehaven-marker',
    html: `
      <div style="width:32px;height:32px;border-radius:50%;background:rgba(8,18,30,0.96);
        border:2px solid ${config.color};display:flex;align-items:center;justify-content:center;font-size:15px;
        box-shadow:0 0 0 3px ${config.color}22,0 4px 12px rgba(0,0,0,0.45),0 0 14px ${config.color}66;
        cursor:pointer;">${config.icon}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function createSafeHavenClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count >= 20 ? 58 : count >= 10 ? 52 : count >= 5 ? 46 : 40;
  return L.divIcon({
    className: 'saferoute-safehaven-cluster',
    html: `
      <div style="width:${size}px;height:${size}px;border-radius:50%;
        background:radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(8,27,38,0.98) 48%, rgba(8,27,38,0.98) 100%);
        border:3px solid #65e6d2;display:flex;align-items:center;justify-content:center;color:#ffffff;
        font-weight:800;font-size:${count >= 100 ? 12 : 14}px;gap:2px;
        box-shadow:0 0 0 4px rgba(101,230,210,0.10),0 6px 18px rgba(0,0,0,0.42),0 0 18px rgba(101,230,210,0.45);">
        <span style="font-size:${count >= 100 ? 12 : 15}px;">🛡️</span><span>${count}</span>
      </div>
    `,
    iconSize: [size, size],
  });
}

/* ============================== DEMO MODE ============================== */

const DEMO_ORIGIN = 'Bhiwandi Railway Station';
const DEMO_DEST = 'B.N.N. College Bhiwandi';
const isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';

/* ============================ CUSTOM START MARKER ============================ */

const createStartIcon = () => L.divIcon({
  className: 'saferoute-start-marker',
  html: `
    <div style="position:relative;width:48px;height:58px;display:flex;align-items:flex-start;justify-content:center;">
      <div style="position:absolute;top:2px;width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:linear-gradient(135deg, #7df2a8 0%, #38c879 100%);border:3px solid #ffffff;
        box-shadow:0 0 0 4px rgba(107,220,150,0.18),0 8px 20px rgba(0,0,0,0.45),0 0 18px rgba(107,220,150,0.45);"></div>
      <div style="position:absolute;top:11px;width:19px;height:19px;border-radius:50%;background:#0b2416;
        border:3px solid rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;
        color:#ffffff;font-size:10px;font-weight:800;z-index:2;">A</div>
      <div style="position:absolute;bottom:0;padding:3px 8px;border-radius:999px;background:rgba(11,19,38,0.94);
        border:1px solid rgba(107,220,150,0.55);color:#6bdc96;font-size:9px;font-weight:800;letter-spacing:0.5px;
        white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);">START</div>
    </div>
  `,
  iconSize: [48, 58],
  iconAnchor: [24, 46],
  popupAnchor: [0, -43],
});

/* ========================= CUSTOM DESTINATION MARKER ========================= */

const createDestinationIcon = () => L.divIcon({
  className: 'saferoute-destination-marker',
  html: `
    <div style="position:relative;width:52px;height:62px;display:flex;align-items:flex-start;justify-content:center;">
      <div style="position:absolute;top:2px;width:40px;height:40px;border-radius:50%;
        background:linear-gradient(135deg, #ff707a 0%, #e83d4c 100%);border:3px solid #ffffff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 0 4px rgba(255,95,95,0.18),0 8px 20px rgba(0,0,0,0.45),0 0 18px rgba(255,95,95,0.45);">
        <div style="width:18px;height:18px;border-radius:50%;border:3px solid rgba(255,255,255,0.95);position:relative;">
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:6px;height:6px;
            border-radius:50%;background:#ffffff;"></div>
        </div>
      </div>
      <div style="position:absolute;bottom:0;padding:3px 8px;border-radius:999px;background:rgba(11,19,38,0.94);
        border:1px solid rgba(255,95,95,0.55);color:#ff707a;font-size:9px;font-weight:800;letter-spacing:0.5px;
        white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);">DESTINATION</div>
    </div>
  `,
  iconSize: [52, 62],
  iconAnchor: [26, 49],
  popupAnchor: [0, -46],
});

const startIcon = createStartIcon();
const destinationIcon = createDestinationIcon();

/* ============================== MAP CONTROLLER ============================== */

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) return;
    const lat = Number(center[0]);
    const lng = Number(center[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.flyTo([lat, lng], 14, { duration: 0.9 });
  }, [center, map]);
  return null;
}

/* ============================ SELECTED ROUTE BOUNDS ============================ */

function SelectedRouteBounds({ route, origin, destination }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    const coordinates = route?.geometry?.coordinates;
    if (Array.isArray(coordinates)) {
      coordinates.forEach((coordinate) => {
        if (!Array.isArray(coordinate) || coordinate.length < 2) return;
        const lng = Number(coordinate[0]);
        const lat = Number(coordinate[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lat, lng]);
      });
    }
    if (origin && Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lng))) {
      points.push([Number(origin.lat), Number(origin.lng)]);
    }
    if (destination && Number.isFinite(Number(destination.lat)) && Number.isFinite(Number(destination.lng))) {
      points.push([Number(destination.lat), Number(destination.lng)]);
    }
    if (points.length < 2) return;
    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.7,
      });
    } catch (error) {
      console.error('Failed to fit selected route bounds:', error);
    }
  }, [route, origin, destination, map]);
  return null;
}

/* ============================== ROUTE POSITIONS ============================== */

function getRoutePositions(route) {
  const coordinates = route?.geometry?.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .filter((coordinate) =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      Number.isFinite(Number(coordinate[0])) &&
      Number.isFinite(Number(coordinate[1]))
    )
    .map(([lng, lat]) => [Number(lat), Number(lng)]);
}

/*
 * Real-world distance (in meters) between two lat/lng points.
 */
function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

/*
 * Trims a polyline so it never overshoots the actual destination.
 * The routing engine sometimes loops slightly past the real destination
 * before terminating, which means the globally-closest point can end up
 * AFTER that loop. To avoid drawing the overshoot, this stops the route
 * at the FIRST point (in travel order) that comes within a small
 * real-world distance of the destination. If no point ever gets close
 * enough, it falls back to trimming at the single closest point overall.
 */
function trimPositionsToDestination(positions, destination, thresholdMeters = 40) {
  if (!Array.isArray(positions) || positions.length < 2) return positions;
  if (!destination) return positions;

  const destLat = Number(destination.lat);
  const destLng = Number(destination.lng);
  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return positions;

  for (let index = 0; index < positions.length; index += 1) {
    const [lat, lng] = positions[index];
    if (haversineDistanceMeters(lat, lng, destLat, destLng) <= thresholdMeters) {
      return positions.slice(0, index + 1);
    }
  }

  let closestIndex = positions.length - 1;
  let closestDistance = Infinity;

  positions.forEach(([lat, lng], index) => {
    const distance = haversineDistanceMeters(lat, lng, destLat, destLng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  if (closestIndex >= positions.length - 1) return positions;

  return positions.slice(0, closestIndex + 1);
}

/* ================================ MAIN COMPONENT ================================ */

export default function RouteSearch() {
  /* ---------------------------- ROUTE SEARCH ---------------------------- */
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  /*
   * IMPORTANT: selectedRoute determines what is drawn on the map.
   * Only this route will be visible.
   */
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [mapCenter, setMapCenter] = useState(BHIWANDI_CENTER);

  /* ---------------------------- INCIDENTS ---------------------------- */
  const [incidents, setIncidents] = useState([]);

  /* ---------------------------- SAFE HAVENS ---------------------------- */
  const [safeHavens, setSafeHavens] = useState([]);
  const [showSafeHavens, setShowSafeHavens] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [fetchingHavens, setFetchingHavens] = useState(false);

  /* ---------------------------- BREAKDOWN ---------------------------- */
  const [showBreakdown, setShowBreakdown] = useState(null);

  /* ---------------------------- FEEDBACK ---------------------------- */
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comments: '', encounteredIssues: [] });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  /* ---------------------------- AUTOCOMPLETE ---------------------------- */
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const originRef = useRef(null);
  const destRef = useRef(null);

  /* ---------------------------- GPS ---------------------------- */
  const { position, startWatch, stopWatch, getOnce: getGPSOnce } = useGPS();

  /* ---------------------------- TOAST ---------------------------- */
  const [toastMessage, setToastMessage] = useState('');

  /* ---------------------------- INCIDENT REPORT MODAL ---------------------------- */
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    type: 'poor_lighting',
    severity: 'medium',
    description: '',
    locationType: 'gps',
    customAddress: '',
    customCoords: null,
  });
  const [modalSuggestions, setModalSuggestions] = useState([]);
  const [modalShowDropdown, setModalShowDropdown] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const modalCustomRef = useRef(null);

  /* ============================= ALL GENUINE ROUTES ============================= */

  const routes = useMemo(() => {
    if (!result || !Array.isArray(result.routes)) return [];
    return result.routes.filter((route) =>
      route && route.geometry &&
      Array.isArray(route.geometry.coordinates) &&
      route.geometry.coordinates.length >= 2
    );
  }, [result]);

  /*
   * IMPORTANT: The backend may return 1, 2 or 3 genuine routes.
   * Your application requirement is:
   * 1. Safest
   * 2. Fastest
   * Therefore the LEFT PANEL shows only those two.
   * If safest === fastest, only ONE card is shown.
   */
  const displayRoutes = useMemo(() => {
    if (!result) return [];
    const output = [];
    const safest = result.safest;
    const fastest = result.fastest;
    if (safest) {
      output.push({ route: safest, type: safest?.id === fastest?.id ? 'safest-fastest' : 'safest' });
    }
    if (fastest && fastest?.id !== safest?.id) {
      output.push({ route: fastest, type: 'fastest' });
    }
    return output;
  }, [result]);

  /* ============================= INITIAL LOAD ============================= */

  useEffect(() => {
    incidentsAPI.getAll(BHIWANDI_CENTER[0], BHIWANDI_CENTER[1], 5000)
      .then((response) => setIncidents(response.data?.incidents || []))
      .catch((err) => console.error('Failed to load incidents:', err));
    getGPSOnce();
  }, [getGPSOnce]);

  /* ============================= DEMO MODE ============================= */

  useEffect(() => {
    if (!isDemo) return;
    setOrigin(DEMO_ORIGIN);
    setDestination(DEMO_DEST);
    setOriginCoords({ lat: 19.26846, lng: 73.04617 });
    setDestCoords({ lat: 19.2903, lng: 73.0520 });
    setMapCenter([19.279, 73.049]);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);
  }, []);

  /* ============================= SAFE HAVENS ============================= */

  useEffect(() => {
    if (!showSafeHavens) {
      setSafeHavens([]);
      return;
    }
    const lat = mapCenter?.[0];
    const lng = mapCenter?.[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setFetchingHavens(true);
    safeHavensAPI.getNearby(lat, lng)
      .then((response) => {
        if (response.data?.success) setSafeHavens(response.data.safeHavens || []);
      })
      .catch((err) => console.error('Failed to load safe havens:', err))
      .finally(() => setFetchingHavens(false));
  }, [showSafeHavens, mapCenter]);

  /* ============================= TOAST ============================= */

  const showToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 4000);
  };

  /* ============================= RATE LIMIT ============================= */

  const checkRateLimit = () => {
    const lastReportTime = localStorage.getItem('lastIncidentReportedTime');
    if (!lastReportTime) return 0;
    const diffMins = (Date.now() - parseInt(lastReportTime, 10)) / (1000 * 60);
    if (diffMins < 10) return Math.ceil(10 - diffMins);
    return 0;
  };

  /* ============================= OPEN REPORT MODAL ============================= */

  const handleOpenReportModal = () => {
    const remaining = checkRateLimit();
    setModalError(remaining > 0 ? `You can report again in ${remaining} minutes.` : '');
    setModalForm({
      type: 'poor_lighting',
      severity: 'medium',
      description: '',
      locationType: 'gps',
      customAddress: '',
      customCoords: null,
    });
    setModalSuggestions([]);
    setModalShowDropdown(false);
    setShowReportModal(true);
    getGPSOnce();
  };

  /* ============================= REPORT INCIDENT ============================= */

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setModalError('');
    const remaining = checkRateLimit();
    if (remaining > 0) {
      setModalError(`You can report again in ${remaining} minutes.`);
      return;
    }

    let reportLat;
    let reportLng;

    if (modalForm.locationType === 'gps') {
      if (!position) {
        setModalError('Location access is required. Please enable GPS or choose a custom location.');
        return;
      }
      reportLat = position.lat;
      reportLng = position.lng;
    } else {
      if (!modalForm.customCoords) {
        setModalError('Please select a valid location from the suggestions.');
        return;
      }
      reportLat = modalForm.customCoords.lat;
      reportLng = modalForm.customCoords.lng;
    }

    setModalSubmitting(true);
    try {
      const { data } = await incidentsAPI.create({
        type: modalForm.type,
        severity: modalForm.severity,
        description: modalForm.description,
        lat: reportLat,
        lng: reportLng,
      });
      localStorage.setItem('lastIncidentReportedTime', Date.now().toString());
      if (data?.incident) setIncidents((previous) => [data.incident, ...previous]);
      setShowReportModal(false);
      showToast('Incident reported. Helping keep Bhiwandi safer.');
    } catch (err) {
      console.error('Report submission error:', err);
      setModalError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setModalSubmitting(false);
    }
  };

  /* ============================= NOMINATIM SEARCH ============================= */

  const searchNominatim = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(trimmed)}` +
      `&format=json` +
      `&limit=5` +
      `&countrycodes=in` +
      `&viewbox=${BHIWANDI_VIEWBOX}` +
      `&bounded=1`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Location search failed');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  /* ============================= ORIGIN AUTOCOMPLETE ============================= */

  useEffect(() => {
    const trimmed = origin.trim();
    if (!trimmed || trimmed === 'Your Current Location' || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(trimmed)) {
      setOriginSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchNominatim(trimmed);
        setOriginSuggestions(data);
      } catch (err) {
        console.error('Origin autocomplete failed:', err);
        setOriginSuggestions([]);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [origin]);

  /* ============================= DESTINATION AUTOCOMPLETE ============================= */

  useEffect(() => {
    const trimmed = destination.trim();
    if (!trimmed || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(trimmed)) {
      setDestSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchNominatim(trimmed);
        setDestSuggestions(data);
      } catch (err) {
        console.error('Destination autocomplete failed:', err);
        setDestSuggestions([]);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [destination]);

  /* ============================= INCIDENT LOCATION AUTOCOMPLETE ============================= */

  useEffect(() => {
    const address = modalForm.customAddress.trim();
    if (!address || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address)) {
      setModalSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchNominatim(address);
        setModalSuggestions(data);
      } catch (err) {
        console.error('Incident location search failed:', err);
        setModalSuggestions([]);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [modalForm.customAddress]);

  /* ============================= CLICK OUTSIDE DROPDOWNS ============================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originRef.current && !originRef.current.contains(event.target)) setShowOriginDropdown(false);
      if (destRef.current && !destRef.current.contains(event.target)) setShowDestDropdown(false);
      if (modalCustomRef.current && !modalCustomRef.current.contains(event.target)) setModalShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ============================= SEARCH ROUTES ============================= */

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both starting point and destination.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedRoute(null);
    setShowBreakdown(null);

    try {
      const payload = {};

      if (originCoords) {
        payload.originCoords = originCoords;
        payload.origin = origin;
      } else {
        payload.origin = origin.trim();
      }

      if (destCoords) {
        payload.destCoords = destCoords;
        payload.destination = destination;
      } else {
        payload.destination = destination.trim();
      }

      const response = await routesAPI.getRoutes(payload);
      const data = response?.data;
      if (!data) throw new Error('No route data received from server.');

      setResult(data);

      /*
       * IMPORTANT: Always select SAFEST first.
       * This means the map initially displays only the safest route.
       */
      if (data.safest) {
        setSelectedRoute(data.safest);
      } else if (Array.isArray(data.routes) && data.routes.length > 0) {
        setSelectedRoute(data.routes[0]);
      }

      if (
        data.origin &&
        Number.isFinite(Number(data.origin.lat)) &&
        Number.isFinite(Number(data.origin.lng))
      ) {
        setMapCenter([Number(data.origin.lat), Number(data.origin.lng)]);
      }
    } catch (err) {
      console.error('Route search error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch routes. Please check your locations and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================= CURRENT LOCATION ============================= */

  const handleUseMyLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOrigin('Your Current Location');
        setOriginCoords({ lat, lng });
        setMapCenter([lat, lng]);
        setShowOriginDropdown(false);
      },
      (err) => {
        console.error('GPS error:', err);
        setError('Location access denied. Please enable GPS or type your starting point.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* ============================= ROUTE SELECTION ============================= */

  const handleSelectRoute = (route) => {
    if (!route) return;
    /*
     * IMPORTANT: This is the main fix.
     * selectedRoute becomes the ONLY route that the map renders.
     */
    setSelectedRoute(route);
    setShowBreakdown(null);
  };

  /* ============================= NAVIGATION ============================= */

  const startNavigation = () => {
    if (!selectedRoute) return;
    setNavigating(true);
    startWatch();
  };

  const stopNavigation = () => {
    setNavigating(false);
    stopWatch();
    setFeedbackForm({ rating: 5, comments: '', encounteredIssues: [] });
    setShowFeedbackModal(true);
  };

  /* ============================= FEEDBACK ============================= */

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRoute) return;

    setFeedbackSubmitting(true);
    try {
      await feedbackAPI.submit({
        routeId: selectedRoute.id,
        rating: feedbackForm.rating,
        encounteredIssues: feedbackForm.encounteredIssues,
        comments: feedbackForm.comments,
      });

      const reportCoords =
        position ||
        destCoords ||
        (result?.destination ? { lat: result.destination.lat, lng: result.destination.lng } : null);

      if (reportCoords && feedbackForm.encounteredIssues.length > 0) {
        for (const issue of feedbackForm.encounteredIssues) {
          try {
            await incidentsAPI.create({
              /*
               * NOTE: "road_hazard" is the backend-supported type.
               */
              type: issue,
              severity: 'medium',
              description: `Auto-reported via post-trip feedback: ${feedbackForm.comments || 'No comment provided.'}`,
              lat: reportCoords.lat,
              lng: reportCoords.lng,
            });
          } catch (reportErr) {
            console.error('Failed to auto-report incident:', reportErr);
          }
        }

        try {
          const response = await incidentsAPI.getAll(BHIWANDI_CENTER[0], BHIWANDI_CENTER[1], 5000);
          setIncidents(response.data?.incidents || []);
        } catch (refreshError) {
          console.error('Failed to refresh incidents:', refreshError);
        }
      }

      showToast('Thank you for your feedback!');
      setShowFeedbackModal(false);
    } catch (err) {
      console.error('Feedback submit error:', err);
      showToast('Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  /* ============================= CURRENT SELECTED ROUTE ============================= */

  const selectedRoutePositions = useMemo(
    () => trimPositionsToDestination(getRoutePositions(selectedRoute), result?.destination),
    [selectedRoute, result]
  );

  /* ================================= RENDER ================================= */

  return (
    <div className={styles.page}>
      {/* ============================= LEFT PANEL ============================= */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h1 className={styles.title}>Navigate Safely</h1>
          <p className={styles.subtitle}>Bhiwandi · Score-ranked routes</p>
        </div>

        {/* SAFE HAVENS TOGGLE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Show Safe Havens</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>Police · Hospitals · Pharmacies</div>
            </div>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={showSafeHavens} onChange={(event) => setShowSafeHavens(event.target.checked)} />
            <span className={styles.slider} />
          </label>
        </div>

        {/* INCIDENTS TOGGLE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Show Incidents</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>Crime · Lighting · Hazards</div>
            </div>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={showIncidents} onChange={(event) => setShowIncidents(event.target.checked)} />
            <span className={styles.slider} />
          </label>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputGroup}>
            {/* ORIGIN */}
            <div className={styles.inputRow} ref={originRef}>
              <span className={styles.inputDot} style={{ background: SAFEST_COLOR }} />
              <input
                className="input"
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value);
                  setOriginCoords(null);
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                placeholder="Enter starting point in Bhiwandi"
              />
              <button type="button" onClick={handleUseMyLocation} className={styles.locBtn} title="Use my current location">🎯</button>
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div className={styles.autocompleteDropdown}>
                  {originSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className={styles.autocompleteItem}
                      onClick={() => {
                        setOrigin(suggestion.display_name);
                        setOriginCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
                        setShowOriginDropdown(false);
                      }}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.divider} />

            {/* DESTINATION */}
            <div className={styles.inputRow} ref={destRef}>
              <span className={styles.inputDot} style={{ background: DESTINATION_COLOR }} />
              <input
                className="input"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setDestCoords(null);
                  setShowDestDropdown(true);
                }}
                onFocus={() => setShowDestDropdown(true)}
                placeholder="Enter destination in Bhiwandi"
              />
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className={styles.autocompleteDropdown}>
                  {destSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className={styles.autocompleteItem}
                      onClick={() => {
                        setDestination(suggestion.display_name);
                        setDestCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
                        setShowDestDropdown(false);
                      }}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={loading}>
            {loading ? '🔍 Calculating safety scores...' : '🛡️ Find Safe Routes'}
          </button>
        </form>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ROUTE RESULTS */}
        <AnimatePresence>
          {result && (
            <motion.div className={styles.results} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* ROUTE COUNT */}
              {routes.length > 0 && (
                <div
                  style={{
                    padding: '9px 12px',
                    marginBottom: 10,
                    borderRadius: 10,
                    background: routes.length > 1 ? 'rgba(107,220,150,0.08)' : 'rgba(255,184,102,0.08)',
                    border: routes.length > 1 ? '1px solid rgba(107,220,150,0.25)' : '1px solid rgba(255,184,102,0.25)',
                    fontSize: 11,
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  {routes.length > 1 ? '🗺️ ' : 'ℹ️ '}
                  <strong style={{ color: routes.length > 1 ? SAFEST_COLOR : '#ffb866' }}>{routes.length}</strong>{' '}
                  genuine route{routes.length > 1 ? 's' : ''} found.
                  <span style={{ marginLeft: 4 }}>Choose Safest or Fastest below.</span>
                </div>
              )}

              {/* SAFETY DIFFERENCE */}
              {!result.isSameRoute && result.scoreDiff != null && (
                <div className={styles.scoreDiff}>
                  <span>🛡️</span>
                  <span>
                    Safest route scores{' '}
                    <strong style={{ color: SAFEST_COLOR }}>+{result.scoreDiff} pts higher</strong>
                    {result.timeDiffMin > 0 && ` · ${result.timeDiffMin} min longer`}
                  </span>
                </div>
              )}

              {/* SAFEST FIRST, FASTEST SECOND */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayRoutes.map(({ route, type }) => {
                  const routeKey = `route-card-${route.id}`;
                  const isSameRoute = type === 'safest-fastest';

                  let label = 'Alternative Route';
                  let labelColor = '#ffb866';

                  if (type === 'safest-fastest') {
                    label = 'Fastest & Safest Route';
                    labelColor = SAFEST_COLOR;
                  } else if (type === 'safest') {
                    label = 'Safest Route';
                    labelColor = SAFEST_COLOR;
                  } else if (type === 'fastest') {
                    label = 'Fastest Route';
                    labelColor = FASTEST_COLOR;
                  }

                  return (
                    <RouteCard
                      key={routeKey}
                      route={route}
                      label={label}
                      labelColor={labelColor}
                      isSelected={selectedRoute?.id === route.id}
                      onSelect={() => handleSelectRoute(route)}
                      onBreakdown={() => setShowBreakdown((previous) => (previous === routeKey ? null : routeKey))}
                      showBreakdown={showBreakdown === routeKey}
                      isSameRoute={isSameRoute}
                    />
                  );
                })}
              </div>

              {/* NAVIGATION */}
              {selectedRoute && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!navigating ? (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={startNavigation}>▶ Start Navigation</button>
                  ) : (
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={stopNavigation}>■ Stop Navigation</button>
                  )}
                </div>
              )}

              {/* LIVE GPS */}
              {navigating && (
                <div className={styles.navStatus}>
                  <div className={styles.navDot} />
                  <span>
                    Live tracking active ·{' '}
                    {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Acquiring GPS...'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================= MAP ============================= */}
      <div className={styles.mapArea}>
        <MapContainer center={BHIWANDI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapController center={mapCenter} />

          {/* ONLY SELECTED ROUTE BOUNDS */}
          <SelectedRouteBounds route={selectedRoute} origin={result?.origin} destination={result?.destination} />

          {/* ONLY SELECTED ROUTE IS DRAWN */}
          {selectedRoute && selectedRoutePositions.length >= 2 && (
            <Polyline
              key={`selected-route-${selectedRoute.id}`}
              positions={selectedRoutePositions}
              pathOptions={{
                color: selectedRoute.id === result?.safest?.id ? SAFEST_COLOR : FASTEST_COLOR,
                weight: 7,
                opacity: 0.98,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* START MARKER */}
          {result?.origin && Number.isFinite(Number(result.origin.lat)) && Number.isFinite(Number(result.origin.lng)) && (
            <Marker position={[Number(result.origin.lat), Number(result.origin.lng)]} icon={startIcon} zIndexOffset={3000}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: SAFEST_COLOR, fontSize: 14 }}>🟢 START</strong>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    {result.origin.name?.split(',')[0] || 'Starting Point'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* DESTINATION MARKER */}
          {result?.destination && Number.isFinite(Number(result.destination.lat)) && Number.isFinite(Number(result.destination.lng)) && (
            <Marker position={[Number(result.destination.lat), Number(result.destination.lng)]} icon={destinationIcon} zIndexOffset={3000}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: DESTINATION_COLOR, fontSize: 14 }}>🔴 DESTINATION</strong>
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    {result.destination.name?.split(',')[0] || 'Destination'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* INCIDENT MARKERS */}
          {showIncidents && (
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              spiderfyOnMaxZoom={true}
              removeOutsideVisibleBounds={true}
              maxClusterRadius={45}
              disableClusteringAtZoom={16}
              iconCreateFunction={createIncidentClusterIcon}
            >
              {incidents.map((incident) => {
                const coordinates = incident?.location?.coordinates;
                if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

                const lng = Number(coordinates[0]);
                const lat = Number(coordinates[1]);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                const config = getIncidentConfig(incident.type);

                return (
                  <Marker
                    key={incident._id}
                    position={[lat, lng]}
                    icon={createIncidentIcon(incident.type, incident.severity)}
                    zIndexOffset={1500}
                  >
                    <Popup>
                      <div style={{ minWidth: 215, color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${config.color}22`, border: `1px solid ${config.color}`, fontSize: 15 }}>
                            {config.icon}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, color: config.color, fontSize: 13 }}>{incident.title || config.label}</div>
                            <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{config.label}</div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 999,
                            marginBottom: 8,
                            fontSize: 10,
                            fontWeight: 800,
                            background: incident.severity === 'high' ? 'rgba(255,95,109,0.15)' : incident.severity === 'medium' ? 'rgba(255,184,102,0.15)' : 'rgba(107,220,150,0.15)',
                            color: incident.severity === 'high' ? '#ff5f6d' : incident.severity === 'medium' ? '#ffb866' : '#6bdc96',
                          }}
                        >
                          {incident.severity?.toUpperCase() || 'MEDIUM'} SEVERITY
                        </div>

                        <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
                          {incident.description || 'No description provided.'}
                        </div>

                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10, opacity: 0.65 }}>
                          Source: {incident.source || 'SafeRoute Community Report'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {/* SAFE HAVENS */}
          {showSafeHavens && (
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              spiderfyOnMaxZoom={true}
              removeOutsideVisibleBounds={true}
              maxClusterRadius={(zoom) => {
                if (zoom <= 12) return 160;
                if (zoom <= 13) return 140;
                if (zoom <= 14) return 120;
                if (zoom <= 15) return 90;
                return 60;
              }}
              disableClusteringAtZoom={18}
              zoomToBoundsOnClick
              spiderfyDistanceMultiplier={1.35}
              iconCreateFunction={createSafeHavenClusterIcon}
            >
              {safeHavens.map((haven) => {
                const config = getSafeHavenConfig(haven.type);
                const lat = Number(haven.lat);
                const lng = Number(haven.lng);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                return (
                  <Marker key={haven.id} position={[lat, lng]} icon={createSafeHavenIcon(haven.type)} zIndexOffset={1200}>
                    <Popup>
                      <div style={{ minWidth: 200, color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${config.color}22`, border: `1px solid ${config.color}`, fontSize: 15 }}>
                            {config.icon}
                          </span>
                          <div>
                            <div style={{ color: config.color, fontWeight: 800, fontSize: 13 }}>{haven.name}</div>
                            <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{config.label}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>🛡️ Safe Haven</div>

                        <button
                          className="btn btn-sm btn-gold"
                          style={{ marginTop: 2, width: '100%', fontSize: 11 }}
                          onClick={() => {
                            setDestination(haven.name);
                            setDestCoords({ lat, lng });
                            setMapCenter([lat, lng]);
                          }}
                        >
                          📍 Route Here
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {/* LIVE GPS */}
          {navigating && position && (
            <Marker
              position={[position.lat, position.lng]}
              icon={L.divIcon({
                className: '',
                html: `
                  <div style="position:relative;width:26px;height:26px;">
                    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(173,199,247,0.18);
                      border:2px solid rgba(173,199,247,0.5);animation:saferoutePulse 1.8s ease-out infinite;"></div>
                    <div style="position:absolute;left:5px;top:5px;width:16px;height:16px;border-radius:50%;
                      background:#adc7f7;border:3px solid #ffffff;box-shadow:0 0 12px rgba(173,199,247,0.9);"></div>
                  </div>
                  <style>
                    @keyframes saferoutePulse {
                      0% { transform:scale(0.75); opacity:0.9; }
                      70% { transform:scale(1.35); opacity:0; }
                      100% { transform:scale(1.35); opacity:0; }
                    }
                  </style>
                `,
                iconSize: [26, 26],
                iconAnchor: [13, 13],
              })}
              zIndexOffset={4000}
            >
              <Popup>📍 You are here</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ROUTE LEGEND */}
        {selectedRoute && (
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 20,
              zIndex: 1000,
              padding: '10px 13px',
              borderRadius: 12,
              background: 'rgba(11,19,38,0.94)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
              fontSize: 11,
              color: '#ffffff',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 7, letterSpacing: 0.4 }}>SELECTED ROUTE</div>
            <LegendItem
              color={selectedRoute.id === result?.safest?.id ? SAFEST_COLOR : FASTEST_COLOR}
              label={
                selectedRoute.id === result?.safest?.id && selectedRoute.id === result?.fastest?.id
                  ? 'Fastest & Safest'
                  : selectedRoute.id === result?.safest?.id
                  ? 'Safest'
                  : 'Fastest'
              }
            />
          </div>
        )}

        {/* MAP LAYER LEGENDS */}
        {(showIncidents || showSafeHavens) && (
          <div
            style={{
              position: 'absolute',
              right: 20,
              bottom: 20,
              zIndex: 1000,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(11,19,38,0.94)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
              fontSize: 10,
              color: '#ffffff',
              maxWidth: 190,
            }}
          >
            {showIncidents && (
              <>
                <div style={{ fontWeight: 800, marginBottom: 7, letterSpacing: 0.4, color: '#ffb866' }}>INCIDENTS</div>
                {Object.entries(INCIDENT_MARKER_CONFIG).map(([type, config]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <span style={{ width: 21, height: 21, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,19,38,0.96)', border: `1px solid ${config.color}`, fontSize: 10, flexShrink: 0 }}>
                      {config.icon}
                    </span>
                    <span>{config.label}</span>
                  </div>
                ))}
              </>
            )}

            {showSafeHavens && (
              <div style={{ marginTop: showIncidents ? 9 : 0, paddingTop: showIncidents ? 8 : 0, borderTop: showIncidents ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ fontWeight: 800, marginBottom: 7, letterSpacing: 0.4, color: '#65e6d2' }}>SAFE HAVENS</div>
                {[
                  ['police', '👮', 'Police Station'],
                  ['hospital', '🏥', 'Hospital'],
                  ['petrol_pump', '⛽', 'Petrol Pump'],
                  ['pharmacy', '💊', 'Pharmacy'],
                  ['fire', '🚒', 'Fire Station'],
                ].map(([type, icon, label]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <span style={{ width: 21, height: 21, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,19,38,0.96)', border: `1px solid ${getSafeHavenConfig(type).color}`, fontSize: 10, flexShrink: 0 }}>
                      {icon}
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
              Zoom in to separate nearby markers.
            </div>
          </div>
        )}

        {/* INCIDENT REPORT FAB */}
        <button className={styles.fab} onClick={handleOpenReportModal} title="Report Safety Incident" style={{ fontSize: 20 }}>⚠️</button>

        {/* SOS */}
        {navigating && <SOSButton position={position} />}

        {/* TOAST */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className={styles.toast}
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEEDBACK MODAL */}
        <AnimatePresence>
          {showFeedbackModal && (
            <FeedbackModal
              styles={styles}
              feedbackForm={feedbackForm}
              setFeedbackForm={setFeedbackForm}
              feedbackSubmitting={feedbackSubmitting}
              onSubmit={handleFeedbackSubmit}
              onClose={() => setShowFeedbackModal(false)}
            />
          )}
        </AnimatePresence>

        {/* REPORT MODAL */}
        <AnimatePresence>
          {showReportModal && (
            <ReportModal
              styles={styles}
              modalForm={modalForm}
              setModalForm={setModalForm}
              modalSuggestions={modalSuggestions}
              modalShowDropdown={modalShowDropdown}
              setModalShowDropdown={setModalShowDropdown}
              modalCustomRef={modalCustomRef}
              modalError={modalError}
              modalSubmitting={modalSubmitting}
              position={position}
              onSubmit={handleReportSubmit}
              onClose={() => setShowReportModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================ LEGEND ITEM ================================ */

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 24, height: 4, borderRadius: 999, background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}88` }} />
      <span>{label}</span>
    </div>
  );
}

/* ================================= ROUTE CARD ================================= */

function RouteCard({ route, label, labelColor, isSelected, onSelect, onBreakdown, showBreakdown, isSameRoute }) {
  if (!route) return null;

  const score = Number(route.safetyScore) || 0;
  const scoreColor =
    route.safetyColor === 'green' ? 'var(--tertiary)' : route.safetyColor === 'red' ? 'var(--error)' : 'var(--secondary)';
  const fill = Math.max(0, Math.min(100, score * 10));

  return (
    <motion.div
      className={`${styles.routeCard} ${isSelected ? styles.selectedCard : ''}`}
      onClick={onSelect}
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.995 }}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* SELECTED INDICATOR */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '3px 7px',
            borderRadius: 999,
            background: 'rgba(107,220,150,0.12)',
            border: '1px solid rgba(107,220,150,0.25)',
            color: SAFEST_COLOR,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.4,
          }}
        >
          SELECTED
        </div>
      )}

      {/* HEADER */}
      <div className={styles.routeCardHeader}>
        <span className={styles.routeLabel} style={{ color: labelColor, paddingRight: isSelected ? 65 : 0 }}>{label}</span>
        <span className={styles.routeScore} style={{ color: scoreColor }}>
          {score.toFixed(1)}/10 {route.safetyLabel || ''}
        </span>
      </div>

      {/* SCORE BAR */}
      <div className="score-bar-track" style={{ margin: '8px 0' }}>
        <motion.div
          className={`score-bar-fill-${route.safetyColor || 'yellow'}`}
          initial={{ width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 9999 }}
        />
      </div>

      {/* STATS */}
      <div className={styles.routeStats}>
        <span>🕐 {route.durationMin ?? '--'} min</span>
        <span>📏 {route.distanceKm ?? '--'} km</span>
        {route.summary && <span>📍 {route.summary}</span>}
      </div>

      {/* BREAKDOWN */}
      <button
        className={styles.breakdownBtn}
        onClick={(event) => {
          event.stopPropagation();
          onBreakdown();
        }}
      >
        {showBreakdown ? '▲ Hide breakdown' : '▼ Why this score?'}
      </button>

      <AnimatePresence>
        {showBreakdown && route.scoreBreakdown && (
          <motion.div
            className={styles.breakdown}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {Object.entries(route.scoreBreakdown).map(([key, value]) => {
              const itemScore = Number(value?.score) || 0;
              return (
                <div key={key} className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>{value?.label || key}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="score-bar-track" style={{ flex: 1 }}>
                      <div
                        className={`score-bar-fill-${itemScore >= 0.7 ? 'green' : itemScore >= 0.5 ? 'yellow' : 'red'}`}
                        style={{ height: '100%', width: `${Math.max(0, Math.min(100, itemScore * 100))}%`, borderRadius: 9999 }}
                      />
                    </div>
                    <span style={{ fontSize: 12, minWidth: 30, fontFamily: 'var(--font-mono)' }}>{itemScore.toFixed(1)}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', minWidth: 28 }}>{value?.weight ?? ''}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================================ FEEDBACK MODAL ================================ */

function FeedbackModal({ styles, feedbackForm, setFeedbackForm, feedbackSubmitting, onSubmit, onClose }) {
  const issues = [
    { /* Must match backend Incident enum. */ val: 'poor_lighting', label: '💡 Poor Lighting' },
    { /* Correct backend value is road_hazard. */ val: 'road_hazard', label: '🚧 Bad Road' },
    { val: 'isolated_area', label: '🌑 Isolated Area' },
    { val: 'suspicious_activity', label: '👁️ Suspicious Activity' },
  ];

  return (
    <div className={styles.modalOverlay}>
      <motion.div
        className={styles.modalCard}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--on-surface-variant)', fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </button>

        <div className={styles.modalTitle}>🎉 Trip Completed!</div>

        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
          Help us make Bhiwandi safer by sharing your feedback.
        </p>

        <form onSubmit={onSubmit}>
          {/* RATING */}
          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Rate your route safety</span>
            <div style={{ display: 'flex', gap: 8, fontSize: 24, margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ cursor: 'pointer', color: star <= feedbackForm.rating ? 'var(--secondary, #ffb866)' : 'var(--outline-variant)' }}
                  onClick={() => setFeedbackForm((previous) => ({ ...previous, rating: star }))}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* ISSUES */}
          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Did you encounter any safety issues?</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
              {issues.map((issue) => {
                const checked = feedbackForm.encounteredIssues.includes(issue.val);
                return (
                  <label
                    key={issue.val}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      border: `1px solid ${checked ? 'var(--secondary)' : 'var(--outline-variant)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: checked ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setFeedbackForm((previous) => {
                          const list = [...previous.encounteredIssues];
                          if (event.target.checked) {
                            if (!list.includes(issue.val)) list.push(issue.val);
                          } else {
                            const index = list.indexOf(issue.val);
                            if (index >= 0) list.splice(index, 1);
                          }
                          return { ...previous, encounteredIssues: list };
                        });
                      }}
                    />
                    {issue.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* COMMENTS */}
          <div className={styles.formGroup}>
            <span className={styles.formLabel}>Additional Comments</span>
            <textarea
              className={styles.textarea}
              rows={3}
              maxLength={300}
              placeholder="Share details (optional)..."
              value={feedbackForm.comments}
              onChange={(event) => setFeedbackForm((previous) => ({ ...previous, comments: event.target.value }))}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Skip</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 2 }} disabled={feedbackSubmitting}>
              {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ============================== REPORT INCIDENT MODAL ============================== */

function ReportModal({
  styles,
  modalForm,
  setModalForm,
  modalSuggestions,
  modalShowDropdown,
  setModalShowDropdown,
  modalCustomRef,
  modalError,
  modalSubmitting,
  position,
  onSubmit,
  onClose,
}) {
  return (
    <div className={styles.modalOverlay}>
      <motion.div className={styles.modalCard} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className={styles.modalTitle}>🛡️ Report Safety Incident</div>

        <form onSubmit={onSubmit}>
          {/* INCIDENT TYPE */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Incident Type</label>
            <select
              className={styles.select}
              value={modalForm.type}
              onChange={(event) => setModalForm((previous) => ({ ...previous, type: event.target.value }))}
            >
              <option value="poor_lighting">💡 Poor Lighting</option>
              <option value="theft">💰 Theft / Snatching</option>
              <option value="harassment">🛑 Harassment</option>
              <option value="isolated_area">🌑 Isolated Area</option>
              <option value="suspicious_activity">👁️ Suspicious Activity</option>
              <option value="road_hazard">🚧 Road Hazard</option>
            </select>
          </div>

          {/* SEVERITY */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Severity Level</label>
            <div className={styles.severityGroup}>
              {['low', 'medium', 'high'].map((severity) => {
                const active = modalForm.severity === severity;
                return (
                  <button
                    key={severity}
                    type="button"
                    className={styles.severityRadio}
                    style={{ border: active ? '1px solid var(--secondary)' : undefined }}
                    onClick={() => setModalForm((previous) => ({ ...previous, severity }))}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description (max 200 chars)</label>
            <textarea
              className={styles.textarea}
              rows={3}
              maxLength={200}
              placeholder="e.g. Broken streetlight near the road..."
              value={modalForm.description}
              onChange={(event) => setModalForm((previous) => ({ ...previous, description: event.target.value }))}
            />
          </div>

          {/* LOCATION SOURCE */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Location Source</label>
            <div className={styles.locationSelector}>
              <button type="button" className={styles.locationTab} onClick={() => setModalForm((previous) => ({ ...previous, locationType: 'gps' }))}>
                📍 Live GPS
              </button>
              <button type="button" className={styles.locationTab} onClick={() => setModalForm((previous) => ({ ...previous, locationType: 'custom' }))}>
                🔍 Search Location
              </button>
            </div>

            {/* GPS */}
            {modalForm.locationType === 'gps' && (
              <div className={styles.readOnlyLoc}>
                {position ? `📍 GPS Coordinates: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : '⏳ Acquiring GPS Location...'}
              </div>
            )}

            {/* CUSTOM LOCATION */}
            {modalForm.locationType === 'custom' && (
              <div className={styles.searchGroup} ref={modalCustomRef}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search location in Bhiwandi..."
                  value={modalForm.customAddress}
                  onChange={(event) => setModalForm((previous) => ({ ...previous, customAddress: event.target.value, customCoords: null }))}
                  onFocus={() => setModalShowDropdown(true)}
                />

                {modalShowDropdown && modalSuggestions.length > 0 && (
                  <div className={styles.autocompleteDropdown}>
                    {modalSuggestions.map((item) => (
                      <div
                        key={item.place_id}
                        className={styles.autocompleteItem}
                        onClick={() => {
                          setModalForm((previous) => ({
                            ...previous,
                            customAddress: item.display_name,
                            customCoords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
                          }));
                          setModalShowDropdown(false);
                        }}
                      >
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}

                {modalForm.customCoords && (
                  <div className={styles.readOnlyLoc}>
                    🎯 Selected: {modalForm.customCoords.lat.toFixed(5)}, {modalForm.customCoords.lng.toFixed(5)}
                  </div>
                )}
              </div>
            )}
          </div>

          {modalError && <div className={styles.error}>⚠️ {modalError}</div>}

          {/* ACTIONS */}
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={modalSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-gold"
              style={{ flex: 1 }}
              disabled={
                modalSubmitting ||
                (modalForm.locationType === 'gps' && !position) ||
                (modalForm.locationType === 'custom' && !modalForm.customCoords)
              }
            >
              {modalSubmitting ? 'Reporting...' : '🛡️ Submit'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
