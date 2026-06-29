import React, { useEffect, useRef } from 'react';

/**
 * Leaflet.js Interactive Map Component
 * Works without Google Maps API and is 100% free.
 */
export default function Map({ center, zoom = 14, markers = [], path = [], height = 400, onMapClick }) {
  const ref = useRef(null);

  /* global L */
  useEffect(() => {
    if (!ref.current || !center || center.lat == null || center.lng == null) return;

    // Check if Leaflet L global is loaded
    if (typeof L === 'undefined') {
      console.warn('Leaflet library not loaded yet.');
      return;
    }

    let map;
    try {
      // Initialize Leaflet map
      map = L.map(ref.current).setView([center.lat, center.lng], zoom);

      // Bind OpenStreetMap free tile layers
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Render custom SVG markers
      (markers || []).forEach((m) => {
        if (m && m.lat != null && m.lng != null) {
          const isDropoff = m.title && m.title.toLowerCase().includes('drop');
          const color = isDropoff ? '#ec4899' : '#6366f1'; // Rose for dropoff, indigo for pickup

          const customIcon = L.divIcon({
            html: `<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
            </svg>`,
            className: 'custom-leaflet-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });

          const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);
          if (m.title) {
            marker.bindPopup(m.title);
          }
        }
      });

      // Render path polyline route
      if (path && path.length > 1) {
        const latLngs = path.map((p) => [p.lat, p.lng]);
        const polyline = L.polyline(latLngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        // Auto zoom and fit path bounds
        map.fitBounds(polyline.getBounds());
      }

      // Handle map clicks
      if (typeof onMapClick === 'function') {
        map.on('click', (e) => {
          if (e.latlng) {
            onMapClick({
              latLng: {
                lat: () => e.latlng.lat,
                lng: () => e.latlng.lng,
              },
            });
          }
        });
      }
    } catch (err) {
      console.warn('Leaflet initialization failed:', err);
    }

    // Cleanup Leaflet instance on unmount
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [center, zoom, markers, path, onMapClick]);

  if (!center || center.lat == null || center.lng == null) {
    return (
      <div className="map-container" style={{ height }} ref={ref}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Map</div>
          <div style={{ fontSize: '0.9rem' }}>Enter pickup and drop locations below</div>
        </div>
      </div>
    );
  }

  return <div className="map-container" style={{ height, borderRadius: '8px', border: '1px solid var(--border-color, #2f2f3f)' }} ref={ref} />;
}

/**
 * Address Autocomplete using OpenStreetMap Nominatim Geocoding API.
 * Free, fast, and does not require an API key.
 */
export function MapAutocomplete({ onPlaceSelected, placeholder = 'Search or enter address...', className = '' }) {
  const [address, setAddress] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Place Autocomplete Search Effect
  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Nominatim geocoder error:', err);
      } finally {
        setLoading(false);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [address]);

  const handleSelect = (item) => {
    const displayName = item.display_name;
    setAddress(displayName);
    setSuggestions([]);
    setIsOpen(false);
    
    if (onPlaceSelected) {
      onPlaceSelected({
        address: displayName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      });
    }
  };

  const handleCoordBlur = (e) => {
    const input = e.target.value;
    const parts = input.split(',').map((s) => s.trim());
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && onPlaceSelected) {
      onPlaceSelected({
        address: address || `Coordinates: ${lat}, ${lng}`,
        lat,
        lng,
      });
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className={`form-input ${className}`}
          placeholder={placeholder}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setIsOpen(true);
          }}
          style={{ width: '100%' }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            🌀
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-tertiary, #1f1f2e)',
          border: '1px solid var(--border-color, #2f2f3f)',
          borderRadius: '8px',
          listStyle: 'none',
          padding: 0,
          margin: '4px 0 0 0',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--border-color, #2f2f3f)',
                color: 'var(--text-primary, #ffffff)',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary, #28283d)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              📍 {item.display_name}
            </li>
          ))}
        </ul>
      )}

      <input
        type="text"
        className={`form-input ${className}`}
        placeholder="Or enter coordinates (e.g. 23.0225, 72.5714)"
        onBlur={handleCoordBlur}
        style={{ marginTop: '0.5rem', width: '100%' }}
      />
    </div>
  );
}
