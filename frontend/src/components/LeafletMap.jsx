import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Create SVG-based Leaflet custom markers to avoid Vite asset resolution issues
const createCustomIcon = (color = '#0284c7', label = '🐾') => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        <span style="transform: rotate(45deg); font-size: 15px; color: #ffffff;">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const LeafletMap = ({
  center = [17.4200, 78.6560],
  zoom = 16,
  safeZone = null,       // { center_latitude, center_longitude, radius_meters }
  currentLocation = null, // { latitude, longitude, is_inside, is_simulated, pet_name }
  markers = [],          // Array of multiple pets: [{ latitude, longitude, name, is_inside, id }]
  polylineCoords = [],   // Array of [lat, lng] for breadcrumb history
  onMapClick = null,     // Callback function (latlng) => void
  style = { height: '100%', width: '100%' },
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = center[0] || 17.4200;
      const initialLon = center[1] || 78.6560;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Layers whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Safe Zone Circle & Center Marker
    if (safeZone && safeZone.center_latitude && safeZone.center_longitude) {
      const szLat = parseFloat(safeZone.center_latitude);
      const szLon = parseFloat(safeZone.center_longitude);
      const radius = parseFloat(safeZone.radius_meters) || 100;

      const circle = L.circle([szLat, szLon], {
        radius: radius,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(layerGroup);

      circle.bindPopup(`<b>Configured Safe Zone</b><br>Permitted Radius: ${radius}m`);

      // Center home marker
      const homeIcon = createCustomIcon('#0f2942', '🏠');
      const homeMarker = L.marker([szLat, szLon], { icon: homeIcon }).addTo(layerGroup);
      homeMarker.bindPopup(`<b>Safe Zone Center</b><br>Lat: ${szLat.toFixed(6)}<br>Lon: ${szLon.toFixed(6)}`);
    }

    // 2. Draw Movement History Polyline
    if (polylineCoords && polylineCoords.length > 1) {
      const polyline = L.polyline(polylineCoords, {
        color: '#0284c7',
        weight: 3,
        opacity: 0.8,
        dashArray: '4, 4',
      }).addTo(layerGroup);

      // Add small circle dots for trail points
      polylineCoords.forEach((pt, idx) => {
        L.circleMarker(pt, {
          radius: 3,
          color: '#0284c7',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 2,
        }).addTo(layerGroup);
      });
    }

    // 3. Draw Single Current Pet Location
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      const petLat = parseFloat(currentLocation.latitude);
      const petLon = parseFloat(currentLocation.longitude);
      const isInside = currentLocation.is_inside;
      const petColor = isInside ? '#16a34a' : '#dc2626';

      const petIcon = createCustomIcon(petColor, '🐾');
      const petMarker = L.marker([petLat, petLon], { icon: petIcon }).addTo(layerGroup);

      const statusBadge = isInside
        ? '<span style="color:#16a34a; font-weight:bold;">INSIDE SAFE ZONE</span>'
        : '<span style="color:#dc2626; font-weight:bold;">OUTSIDE SAFE ZONE</span>';

      const simText = currentLocation.is_simulated
        ? '<br><small style="color:#6b21a8; font-weight:600;">[SIMULATED GPS GPS-FIX]</small>'
        : '';

      petMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <b>${currentLocation.pet_name || 'Pet Location'}</b><br>
          Status: ${statusBadge}${simText}<br>
          Lat: ${petLat.toFixed(6)}<br>
          Lon: ${petLon.toFixed(6)}<br>
          Distance: ${currentLocation.distance_from_center || 0}m
        </div>
      `).openPopup();

      map.panTo([petLat, petLon]);
    }

    // 4. Draw Multiple Pet Markers (for Dashboard overview map)
    if (markers && markers.length > 0) {
      const bounds = [];
      markers.forEach((m) => {
        if (!m.latitude || !m.longitude) return;
        const lat = parseFloat(m.latitude);
        const lon = parseFloat(m.longitude);
        bounds.push([lat, lon]);

        const markerColor = m.status === 'INSIDE' ? '#16a34a' : m.status === 'OUTSIDE' ? '#dc2626' : '#64748b';
        const icon = createCustomIcon(markerColor, '🐾');
        const marker = L.marker([lat, lon], { icon }).addTo(layerGroup);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <b>${m.name}</b> (${m.species || 'Pet'})<br>
            Status: <b style="color:${markerColor}">${m.status}</b><br>
            Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}
          </div>
        `);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 16);
      }
    }
  }, [safeZone, currentLocation, markers, polylineCoords]);

  return <div ref={mapContainerRef} style={style} />;
};

export default LeafletMap;
