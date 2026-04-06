import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { DELHI_NCR_BOUNDS, DELHI_NCR_CENTER, MAP_CONFIG } from '../hooks/useMapBounds';

// Fix default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker icons
const createIcon = (color) =>
  new L.DivIcon({
    className: 'custom-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="white" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const startIcon = createIcon('#1a73e8');
const endIcon = createIcon('#ea4335');
const searchIcon = createIcon('#34a853');

// Tile URLs
const TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Inner component to handle map bounds enforcement
 */
function MapBoundsEnforcer() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(
      L.latLng(DELHI_NCR_BOUNDS.southWest),
      L.latLng(DELHI_NCR_BOUNDS.northEast)
    );
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;
    map.options.worldCopyJump = false;
  }, [map]);

  return null;
}

/**
 * Inner component to handle routing
 */
function RoutingControl({ startCoords, endCoords, onRouteFound, onRouteLoading }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    // Clean up previous control
    if (controlRef.current) {
      try { map.removeControl(controlRef.current); } catch (e) {}
      controlRef.current = null;
    }

    if (!startCoords || !endCoords) return;

    onRouteLoading(true);

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startCoords[0], startCoords[1]),
        L.latLng(endCoords[0], endCoords[1]),
      ],
      routeWhileDragging: true,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      show: false, // We build our own panel
      lineOptions: {
        styles: [
          { color: '#1a73e8', opacity: 0.85, weight: 6 },
          { color: '#ffffff', opacity: 0.4, weight: 8 }, // outline
        ],
        addWaypoints: false,
      },
      createMarker: () => null, // We draw our own markers
    });

    routingControl.on('routesfound', (e) => {
      const route = e.routes[0];
      const instructions = route.instructions.map((inst) => ({
        text: inst.text,
        distance: inst.distance,
        time: inst.time,
        type: inst.type,
      }));
      onRouteFound({
        totalDistance: route.summary.totalDistance,
        totalTime: route.summary.totalTime,
        instructions,
      });
      onRouteLoading(false);
    });

    routingControl.on('routingerror', (e) => {
      console.error('Routing error:', e);
      onRouteLoading(false);
    });

    routingControl.addTo(map);
    controlRef.current = routingControl;

    return () => {
      if (controlRef.current) {
        try { map.removeControl(controlRef.current); } catch (e) {}
        controlRef.current = null;
      }
    };
  }, [map, startCoords, endCoords, onRouteFound, onRouteLoading]);

  return null;
}

/**
 * Fly to a location
 */
function FlyToLocation({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, zoom || 15, { duration: 0.8 });
    }
  }, [map, coords, zoom]);
  return null;
}

/**
 * Main MapArea component
 */
export default function MapArea({
  theme,
  searchMarker,
  routeStart,
  routeEnd,
  onRouteFound,
  onRouteLoading,
  mapRef,
}) {
  const tileUrl = theme === 'dark' ? TILE_DARK : TILE_LIGHT;

  const bounds = L.latLngBounds(
    L.latLng(DELHI_NCR_BOUNDS.southWest),
    L.latLng(DELHI_NCR_BOUNDS.northEast)
  );

  return (
    <MapContainer
      center={DELHI_NCR_CENTER}
      zoom={MAP_CONFIG.defaultZoom}
      minZoom={MAP_CONFIG.minZoom}
      maxZoom={MAP_CONFIG.maxZoom}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      worldCopyJump={false}
      ref={mapRef}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        key={tileUrl}
        attribution={ATTRIBUTION}
        url={tileUrl}
      />

      <MapBoundsEnforcer />

      {/* Fly to search result */}
      {searchMarker && <FlyToLocation coords={[searchMarker.lat, searchMarker.lng]} />}

      {/* Search marker */}
      {searchMarker && (
        <Marker position={[searchMarker.lat, searchMarker.lng]} icon={searchIcon}>
          <Popup>
            <strong>{searchMarker.name?.split(',')[0]}</strong>
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>
              {searchMarker.name?.split(',').slice(1, 3).join(',')}
            </span>
          </Popup>
        </Marker>
      )}

      {/* Route start marker */}
      {routeStart && (
        <Marker position={routeStart} icon={startIcon}>
          <Popup>Start</Popup>
        </Marker>
      )}

      {/* Route end marker */}
      {routeEnd && (
        <Marker position={routeEnd} icon={endIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Routing engine */}
      {routeStart && routeEnd && (
        <RoutingControl
          startCoords={routeStart}
          endCoords={routeEnd}
          onRouteFound={onRouteFound}
          onRouteLoading={onRouteLoading}
        />
      )}
    </MapContainer>
  );
}
