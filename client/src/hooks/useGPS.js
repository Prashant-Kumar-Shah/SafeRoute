import { useState, useEffect, useCallback, useRef } from 'react';

export const useGPS = ({ onPosition, onError, watch = false } = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchId = useRef(null);

  const handleSuccess = useCallback((pos) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    const location = { lat, lng, accuracy };
    setPosition(location);
    setLoading(false);
    onPosition?.(location);
  }, [onPosition]);

  const handleError = useCallback((err) => {
    const messages = {
      1: 'Location permission denied. Please enable location access for SafeRoute.',
      2: 'Location unavailable. Check your GPS signal.',
      3: 'Location request timed out. Try again.',
    };
    const message = messages[err.code] || 'Location error occurred.';
    setError(message);
    setLoading(false);
    onError?.(message);
  }, [onError]);

  const getOnce = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser.';
      setError(msg);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  }, [handleSuccess, handleError]);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLoading(true);
    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });
  }, [handleSuccess, handleError]);

  const stopWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    if (watch) {
      startWatch();
      return stopWatch;
    }
  }, [watch, startWatch, stopWatch]);

  return { position, error, loading, getOnce, startWatch, stopWatch };
};
