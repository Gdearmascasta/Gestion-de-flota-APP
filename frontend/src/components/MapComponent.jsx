import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const packageIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

function MapBounds({ vehiculos, pedidos }) {
  const map = useMap();
  useEffect(() => {
    if (vehiculos.length === 0 && pedidos.length === 0) return;
    
    const bounds = L.latLngBounds();
    vehiculos.forEach(v => bounds.extend([v.latitud, v.longitud]));
    pedidos.forEach(p => bounds.extend([p.latitud, p.longitud]));
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehiculos, pedidos, map]);
  
  return null;
}

function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

const MapComponent = ({ vehiculos, pedidos, rutas, onMapClick }) => {
  const center = vehiculos.length > 0 ? [vehiculos[0].latitud, vehiculos[0].longitud] : [10.3910, -75.4794];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', cursor: onMapClick ? 'crosshair' : '' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <MapClickListener onMapClick={onMapClick} />
      <MapBounds vehiculos={vehiculos} pedidos={pedidos} />

      {vehiculos.map(v => (
        <Marker key={`v-${v.id}`} position={[v.latitud, v.longitud]} icon={truckIcon}>
          <Popup>
            <strong>Vehículo: {v.id}</strong><br/>
            Capacidad: {v.capacidad}
          </Popup>
        </Marker>
      ))}

      {pedidos.map(p => (
        <Marker key={`p-${p.id}`} position={[p.latitud, p.longitud]} icon={packageIcon}>
          <Popup>
            <strong>Pedido: {p.id}</strong><br/>
            Demanda: {p.demanda}
          </Popup>
        </Marker>
      ))}

      {rutas && rutas.map((ruta, i) => (
        <Polyline 
          key={`r-${ruta.vehiculo_id}`} 
          positions={ruta.coordenadas} 
          pathOptions={{ 
            color: colors[i % colors.length], 
            weight: 4, 
            opacity: 0.8,
            dashArray: '10, 10'
          }}
        >
          <Popup>
            <strong>Ruta Vehículo {ruta.vehiculo_id}</strong><br/>
            Distancia: {ruta.distancia.toFixed(2)} km<br/>
            Carga: {ruta.carga_total}
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
