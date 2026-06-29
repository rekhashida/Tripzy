import React, { useEffect, useRef } from 'react';

/**
 * Leaflet.js Interactive Map Component
 * Works without Google Maps API and is 100% free.
 * Supports Street, Satellite, and Dark Mode layers.
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
      // Initialize Leaflet map instance
      map = L.map(ref.current).setView([center.lat, center.lng], zoom);

      // Define map layer options (100% free tiles)
      const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      });

      const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      const darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });

      // Default map display layer (Dark Mode to match Tripzy UI theme)
      darkMap.addTo(map);

      // Add switcher control in top-right corner
      const baseMaps = {
        "Dark Mode": darkMap,
        "Normal (Street)": streetMap,
        "Satellite": satelliteMap
      };
      L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

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
 * Biased to India and features self-healing junction/circle fallbacks.
 */
export function MapAutocomplete({ onPlaceSelected, value = '', placeholder = 'Search or enter address...', className = '' }) {
  const [address, setAddress] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef(null);

  // Sync state with incoming value updates
  useEffect(() => {
    if (value) {
      setAddress(value);
    }
  }, [value]);

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
        // Bias to India by setting countrycodes=in
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1&countrycodes=in`;
        
        let response = await fetch(url);
        if (response.ok) {
          let data = await response.json();
          
          // Detect Indian localized junction words
          const lowerAddress = address.toLowerCase();
          const hasJunctionKeyword = lowerAddress.includes('circle') || lowerAddress.includes('chowkdi') || lowerAddress.includes('chokdi') || lowerAddress.includes('crossroad');
          
          // Self-healing fallback: If search is empty, translate localized names (e.g. circle -> char rasta)
          if (data.length === 0 && hasJunctionKeyword) {
            const fallbackQuery = address
              .replace(/circle/gi, 'char rasta')
              .replace(/chowkdi/gi, 'char rasta')
              .replace(/chokdi/gi, 'char rasta')
              .replace(/crossroad[s]?/gi, 'char rasta');
              
            let fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=5&addressdetails=1&countrycodes=in`;
            let fallbackResponse = await fetch(fallbackUrl);
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (fallbackData && fallbackData.length > 0) {
                data = fallbackData;
              } else {
                // If "char rasta" also fails, strip junction keyword completely to find the general neighborhood
                const strippedQuery = address
                  .replace(/circle/gi, '')
                  .replace(/chowkdi/gi, '')
                  .replace(/chokdi/gi, '')
                  .replace(/crossroad[s]?/gi, '');
                  
                let strippedUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(strippedQuery)}&limit=5&addressdetails=1&countrycodes=in`;
                let strippedResponse = await fetch(strippedUrl);
                if (strippedResponse.ok) {
                  data = await strippedResponse.json();
                }
              }
            }
          }
          
          setSuggestions(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Nominatim geocoder error:', err);
      } finally {
        setLoading(false);
      }
    }, 450); // 450ms debounce to prevent API rate limits

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
    </div>
  );
}
