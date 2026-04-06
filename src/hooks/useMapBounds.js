/**
 * useMapBounds — Delhi NCR bounding box constants & helpers
 */

// Delhi NCR bounding box
export const DELHI_NCR_BOUNDS = {
  southWest: [28.2045, 76.8370],
  northEast: [28.8830, 77.7090],
};

export const DELHI_NCR_CENTER = [28.6139, 77.2090]; // Approx center (near India Gate)

export const MAP_CONFIG = {
  minZoom: 10,
  maxZoom: 18,
  defaultZoom: 11,
};

/**
 * Check if a lat/lng is within Delhi NCR bounds
 */
export function isWithinDelhiNCR(lat, lng) {
  const { southWest, northEast } = DELHI_NCR_BOUNDS;
  return (
    lat >= southWest[0] &&
    lat <= northEast[0] &&
    lng >= southWest[1] &&
    lng <= northEast[1]
  );
}

/**
 * Build a Nominatim search URL restricted to Delhi NCR region
 */
export function buildNominatimUrl(query) {
  const { southWest, northEast } = DELHI_NCR_BOUNDS;
  const viewbox = `${southWest[1]},${northEast[0]},${northEast[1]},${southWest[0]}`;
  return `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=6&addressdetails=1`;
}

/**
 * Build a Photon search URL (alternative geocoder)
 */
export function buildPhotonUrl(query) {
  const { southWest, northEast } = DELHI_NCR_BOUNDS;
  const lat = (southWest[0] + northEast[0]) / 2;
  const lon = (southWest[1] + northEast[1]) / 2;
  return `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}&limit=6`;
}

export default function useMapBounds() {
  return {
    bounds: DELHI_NCR_BOUNDS,
    center: DELHI_NCR_CENTER,
    config: MAP_CONFIG,
    isWithinDelhiNCR,
    buildNominatimUrl,
    buildPhotonUrl,
  };
}
