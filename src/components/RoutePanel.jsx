import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowUpDown, Navigation, X, MapPin, Clock, Route as RouteIcon } from 'lucide-react';
import { buildNominatimUrl, isWithinDelhiNCR } from '../hooks/useMapBounds';

const DEBOUNCE = 350;

export default function RoutePanel({ onClose, onRoute, routeData, isLoading, showToast }) {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [activeField, setActiveField] = useState(null); // 'origin' | 'dest'
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  const searchPlaces = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const url = buildNominatimUrl(q);
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const filtered = data.filter(item =>
        isWithinDelhiNCR(parseFloat(item.lat), parseFloat(item.lon))
      );
      if (filtered.length === 0 && data.length > 0) {
        showToast('Out of supported region — only Delhi NCR is available');
      }
      setSuggestions(filtered.slice(0, 5));
    } catch (err) {
      console.error('Route search error:', err);
      setSuggestions([]);
    }
  }, [showToast]);

  const handleInput = (field, value) => {
    if (field === 'origin') {
      setOriginQuery(value);
      setOriginCoords(null);
    } else {
      setDestQuery(value);
      setDestCoords(null);
    }
    setActiveField(field);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), DEBOUNCE);
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const name = item.display_name.split(',')[0];

    if (activeField === 'origin') {
      setOriginQuery(name);
      setOriginCoords([lat, lon]);
    } else {
      setDestQuery(name);
      setDestCoords([lat, lon]);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSwap = () => {
    setOriginQuery(destQuery);
    setDestQuery(originQuery);
    setOriginCoords(destCoords);
    setDestCoords(originCoords);
  };

  const handleGetRoute = () => {
    if (!originCoords || !destCoords) return;
    onRoute(originCoords, destCoords);
  };

  const handleClear = () => {
    setOriginQuery('');
    setDestQuery('');
    setOriginCoords(null);
    setDestCoords(null);
    setSuggestions([]);
    onRoute(null, null); // clear route
  };

  const handleUseMyLocation = (field) => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinDelhiNCR(latitude, longitude)) {
          showToast('Your location is outside Delhi NCR');
          return;
        }
        if (field === 'origin') {
          setOriginQuery('My Location');
          setOriginCoords([latitude, longitude]);
        } else {
          setDestQuery('My Location');
          setDestCoords([latitude, longitude]);
        }
      },
      () => showToast('Unable to get your location'),
      { enableHighAccuracy: true }
    );
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  const formatDistance = (meters) => {
    if (!meters) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="route-panel-overlay">
      {/* Header */}
      <div className="route-panel-header">
        <button className="back-btn" onClick={onClose} aria-label="Close directions">
          <ArrowLeft size={22} />
        </button>

        <div className="route-inputs">
          <div className="route-input-row">
            <span className="route-dot start"></span>
            <input
              id="route-origin"
              type="text"
              placeholder="Choose starting point"
              value={originQuery}
              onChange={(e) => handleInput('origin', e.target.value)}
              onFocus={() => setActiveField('origin')}
              autoComplete="off"
            />
            <button
              className="swap-btn"
              onClick={() => handleUseMyLocation('origin')}
              title="Use my location"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}
            >
              <MapPin size={16} />
            </button>
          </div>

          <div className="route-input-row">
            <span className="route-dot end"></span>
            <input
              id="route-destination"
              type="text"
              placeholder="Choose destination"
              value={destQuery}
              onChange={(e) => handleInput('dest', e.target.value)}
              onFocus={() => setActiveField('dest')}
              autoComplete="off"
            />
            <button className="swap-btn" onClick={handleSwap} title="Swap origin and destination">
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions dropdown inline */}
      {suggestions.length > 0 && activeField && (
        <div style={{ borderBottom: '1px solid var(--color-outline)' }}>
          {suggestions.map((item, i) => (
            <div key={item.place_id || i} className="autocomplete-item" onClick={() => handleSelect(item)}>
              <div className="place-icon">
                <MapPin size={18} />
              </div>
              <div className="place-info">
                <div className="place-name">{item.display_name.split(',')[0]}</div>
                <div className="place-address">{item.display_name.split(',').slice(1, 3).join(',')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="route-panel-actions">
        <button
          className="route-go-btn"
          onClick={handleGetRoute}
          disabled={!originCoords || !destCoords || isLoading}
        >
          <Navigation size={18} />
          {isLoading ? 'Calculating...' : 'Get Directions'}
        </button>
        <button className="route-clear-btn" onClick={handleClear}>
          <X size={16} />
          Clear
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="route-loading">
          <div className="spinner"></div>
          <span>Finding best route...</span>
        </div>
      )}

      {/* Route Summary */}
      {routeData && !isLoading && (
        <>
          <div className="route-summary">
            <div>
              <div className="route-summary-distance" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                <RouteIcon size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {formatDistance(routeData.totalDistance)}
              </div>
            </div>
          </div>

          {/* Turn by turn directions */}
          <div className="route-instructions">
            {routeData.instructions && routeData.instructions.map((step, i) => (
              <div key={i} className="instruction-step">
                <div className="step-icon">{i + 1}</div>
                <div className="step-text" dangerouslySetInnerHTML={{ __html: step.text }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
