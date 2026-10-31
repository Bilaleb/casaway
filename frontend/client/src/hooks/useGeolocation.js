import { useEffect, useRef, useState } from 'react';
import { STRINGS } from '../data/depots.js';

const THEME_KEY = 'casaway-theme';

export function readStoredLocale() {
  try {
    const saved = localStorage.getItem('casaway-locale');
    return saved === 'en' || saved === 'fr' || saved === 'ar' ? saved : 'en';
  } catch {
    return 'en';
  }
}

export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* private mode */
  }
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Current user position as [lat, lon] or null. */
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [notice, setNotice] = useState('');
  const mountedRef = useRef(true);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setNotice(STRINGS.en.locationDenied);
      return;
    }
    setNotice(STRINGS.en.locating);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setNotice('');
      },
      () => {
        if (!mountedRef.current) return;
        setNotice(STRINGS.en.locationDenied);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { position, notice, requestLocation, setNotice };
}
