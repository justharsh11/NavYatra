import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { buildNominatimUrl, isWithinDelhiNCR } from '../hooks/useMapBounds';

const SEARCH_DEBOUNCE = 350;

export default function SearchBar({ onSelectPlace, onOpenDirections, showToast }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchPlaces = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const url = buildNominatimUrl(q);
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await res.json();

      // Filter to only results within Delhi NCR
      const filtered = data.filter(item =>
        isWithinDelhiNCR(parseFloat(item.lat), parseFloat(item.lon))
      );

      if (filtered.length === 0 && data.length > 0) {
        // Results exist but outside Delhi NCR
        showToast('Out of supported region — only Delhi NCR is available');
      }

      setResults(filtered.slice(0, 5));
      setShowDropdown(filtered.length > 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), SEARCH_DEBOUNCE);
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    setQuery(item.display_name.split(',')[0]);
    setShowDropdown(false);
    setResults([]);
    onSelectPlace({ lat, lng: lon, name: item.display_name });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-bar">
        <Search size={20} style={{ color: 'var(--color-on-surface-variant)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="Search Delhi NCR"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button className="clear-btn" onClick={handleClear} aria-label="Clear search">
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="autocomplete-dropdown">
          {results.map((item, i) => (
            <div
              key={item.place_id || i}
              className="autocomplete-item"
              onClick={() => handleSelect(item)}
            >
              <div className="place-icon">
                <MapPin size={18} />
              </div>
              <div className="place-info">
                <div className="place-name">{item.display_name.split(',')[0]}</div>
                <div className="place-address">
                  {item.display_name.split(',').slice(1, 3).join(',')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
