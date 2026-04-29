import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import SeverityBadge from './SeverityBadge';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const IncidentMap = ({ incidents }) => {
  // Center map on US by default or the first incident if available
  const defaultCenter = [39.8283, -98.5795]; // Center of US
  const center = incidents && incidents.length > 0 && incidents[0].latitude
    ? [incidents[0].latitude, incidents[0].longitude]
    : defaultCenter;

  const validIncidents = incidents ? incidents.filter(i => i.latitude && i.longitude) : [];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-100 shadow-sm z-0">
      <MapContainer
        center={center}
        zoom={4}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validIncidents.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.latitude, incident.longitude]}
          >
            <Popup className="incident-popup">
              <div className="min-w-[200px] p-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-800 text-sm">{incident.category}</span>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                  {incident.report_text}
                </p>
                <div className="text-xs text-gray-400">
                  Incident #{incident.id}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default IncidentMap;
