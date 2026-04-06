import React from 'react';
import { Plus, Minus, Crosshair, Navigation } from 'lucide-react';

export default function FloatingControls({ onZoomIn, onZoomOut, onLocateMe, onOpenDirections }) {
  return (
    <>
      {/* Directions FAB — bottom left */}
      <div className="directions-fab">
        <button className="fab fab-primary" onClick={onOpenDirections} aria-label="Get directions">
          <Navigation size={22} />
          <span>Directions</span>
        </button>
      </div>

      {/* Right-side controls */}
      <div className="floating-controls">
        {/* Locate Me */}
        <button className="fab" onClick={onLocateMe} aria-label="My location" title="My location">
          <Crosshair size={22} />
        </button>

        {/* Zoom */}
        <div className="zoom-group">
          <button className="fab" onClick={onZoomIn} aria-label="Zoom in">
            <Plus size={22} />
          </button>
          <button className="fab" onClick={onZoomOut} aria-label="Zoom out">
            <Minus size={22} />
          </button>
        </div>
      </div>
    </>
  );
}
