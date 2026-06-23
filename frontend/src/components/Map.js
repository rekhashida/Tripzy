import React, { useEffect, useRef } from 'react';

/**
 * Simple map placeholder - works without Google Maps API.
 * Shows a styled box with markers info. Add REACT_APP_GOOGLE_MAPS_API_KEY to use real maps.
 */
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window object'));
    if (window.google && window.google.maps) return resolve(window.google);

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}

export default function Map({ center, zoom = 14, markers = [], path = [], height = 400, onMapClick }) {
  const ref = useRef(null);

  useEffect(() => {
    const initMap = async () => {
      if (!ref.current || !center) return;

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!window.google && apiKey) {
        try {
          await loadGoogleMaps(apiKey);
        } catch (err) {
          console.warn('Google Maps load error:', err);
        }
      }

      if (!window.google || !window.google.maps) return;

      try {
        const map = new window.google.maps.Map(ref.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: zoom || 14,
        });

        const markerObjs = [];
        (markers || []).forEach((m) => {
          if (m && m.lat != null && m.lng != null) {
            markerObjs.push(
              new window.google.maps.Marker({
                position: { lat: m.lat, lng: m.lng },
                map,
                title: m.title || '',
              })
            );
          }
        });

        if (path && path.length > 1) {
          const polyline = new window.google.maps.Polyline({
            path: path.map((p) => ({ lat: p.lat, lng: p.lng })),
            geodesic: true,
            strokeColor: '#6366f1',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          polyline.setMap(map);

          const bounds = new window.google.maps.LatLngBounds();
          path.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
          map.fitBounds(bounds);
        }

        if (typeof onMapClick === 'function') {
          map.addListener('click', (e) => {
            if (e.latLng) {
              onMapClick({
                latLng: {
                  lat: () => e.latLng.lat(),
                  lng: () => e.latLng.lng(),
                },
              });
            }
          });
        }
      } catch (err) {
        console.warn('Google Maps init error:', err);
      }
    };

    initMap();
  }, [center, zoom, markers, path, height, onMapClick]);

  if (!center || center.lat == null || center.lng == null) {
    return (
      <div className="map-container" style={{ height }} ref={ref}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Map</div>
          <div style={{ fontSize: '0.9rem' }}>Enter pickup and drop coordinates below</div>
        </div>
      </div>
    );
  }

  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return <div className="map-container" style={{ height }} ref={ref} />;
  }

  return (
    <div className="map-container" style={{ height }} ref={ref}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Map</div>
        <div style={{ fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
          Add Google Maps script with key in public/index.html to see map. Coordinates: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </div>
        {markers && markers.length > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            Markers: {markers.filter(Boolean).length}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Location input: address text + optional lat,lng. No Google API required.
 */
export function MapAutocomplete({ onPlaceSelected, placeholder = 'Search or enter address...', className = '' }) {
  const [address, setAddress] = React.useState('');
  const [coordInput, setCoordInput] = React.useState('');

  const handleCoordBlur = () => {
    const parts = coordInput.split(',').map((s) => s.trim());
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && onPlaceSelected) {
      onPlaceSelected({
        address: address || `${lat}, ${lng}`,
        lat,
        lng,
      });
    }
  };

  return (
    <div>
      <input
        type="text"
        className={`form-input ${className}`}
        placeholder={placeholder}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        type="text"
        className={`form-input ${className}`}
        placeholder="Or enter lat, lng (e.g. 23.0225, 72.5714)"
        value={coordInput}
        onChange={(e) => setCoordInput(e.target.value)}
        onBlur={handleCoordBlur}
        style={{ marginTop: '0.5rem' }}
      />
    </div>
  );
}
