import React, { useState, useRef, useCallback } from 'react';
import useTheme from './hooks/useTheme';
import { isWithinDelhiNCR } from './hooks/useMapBounds';

import MapArea from './components/MapArea';
import SearchBar from './components/SearchBar';
import RoutePanel from './components/RoutePanel';
import ThemeToggle from './components/ThemeToggle';
import FloatingControls from './components/FloatingControls';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Map ref for zoom/pan controls
  const mapRef = useRef(null);

  // Search state
  const [searchMarker, setSearchMarker] = useState(null);

  // Route state
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Search handler
  const handleSelectPlace = useCallback((place) => {
    setSearchMarker(place);
    setShowRoutePanel(false);
  }, []);

  // Route handlers
  const handleOpenDirections = useCallback(() => {
    setShowRoutePanel(true);
    setSearchMarker(null);
  }, []);

  const handleCloseDirections = useCallback(() => {
    setShowRoutePanel(false);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteData(null);
  }, []);

  const handleRoute = useCallback((start, end) => {
    if (!start || !end) {
      setRouteStart(null);
      setRouteEnd(null);
      setRouteData(null);
      return;
    }
    setRouteStart(start);
    setRouteEnd(end);
    setRouteData(null);
  }, []);

  const handleRouteFound = useCallback((data) => {
    setRouteData(data);
  }, []);

  const handleRouteLoading = useCallback((loading) => {
    setIsRouteLoading(loading);
  }, []);

  // Locate me
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinDelhiNCR(latitude, longitude)) {
          showToast('Your location is outside Delhi NCR');
          return;
        }
        const map = mapRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 15, { duration: 0.8 });
        }
        setSearchMarker({ lat: latitude, lng: longitude, name: 'My Location' });
      },
      () => showToast('Unable to access your location'),
      { enableHighAccuracy: true }
    );
  }, [showToast]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const map = mapRef.current;
    if (map) map.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current;
    if (map) map.zoomOut();
  }, []);

  return (
    <div className="app-shell">
      {/* Map */}
      <div className="map-layer">
        <MapArea
          theme={theme}
          searchMarker={searchMarker}
          routeStart={routeStart}
          routeEnd={routeEnd}
          onRouteFound={handleRouteFound}
          onRouteLoading={handleRouteLoading}
          mapRef={mapRef}
        />
      </div>

      {/* Search bar — hidden when route panel is open */}
      {!showRoutePanel && (
        <SearchBar
          onSelectPlace={handleSelectPlace}
          onOpenDirections={handleOpenDirections}
          showToast={showToast}
        />
      )}

      {/* Route panel */}
      {showRoutePanel && (
        <RoutePanel
          onClose={handleCloseDirections}
          onRoute={handleRoute}
          routeData={routeData}
          isLoading={isRouteLoading}
          showToast={showToast}
        />
      )}

      {/* Theme toggle */}
      {!showRoutePanel && (
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      )}

      {/* Floating controls */}
      {!showRoutePanel && (
        <FloatingControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocateMe={handleLocateMe}
          onOpenDirections={handleOpenDirections}
        />
      )}

      {/* Toast */}
      {toast && <div className="error-toast">{toast}</div>}
    </div>
  );
}
