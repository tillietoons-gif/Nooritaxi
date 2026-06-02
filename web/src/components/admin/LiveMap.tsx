'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';

import 'leaflet/dist/leaflet.css';

interface DriverLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export default function LiveMap() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const mapCenter: L.LatLngExpression = [34.5281, 69.1723]; // Kabul

  useEffect(() => {
    const fetchInitialDrivers = async () => {
      try {
        const token = localStorage.getItem('authToken'); 
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api'}/admin-tracking/online-drivers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch driver data. You may not have permission.');
        }

        const data: DriverLocation[] = await response.json();
        setDrivers(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Fetch error:', err);
      }
    };

    fetchInitialDrivers();

    const token = localStorage.getItem('authToken');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/tracking';

    if (!token) return;

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('joinAdminTracking');
    });

    socket.on('driverLocationUpdated', (data: { driverId: string; lat: number; lng: number }) => {
      console.log('Received location update:', data);
      setDrivers((prevDrivers) => {
        const existingDriverIndex = prevDrivers.findIndex(d => d.id === data.driverId);
        
        if (existingDriverIndex !== -1) {
          const updatedDrivers = [...prevDrivers];
          updatedDrivers[existingDriverIndex] = {
            ...updatedDrivers[existingDriverIndex],
            lat: data.lat,
            lng: data.lng,
          };
          return updatedDrivers;
        } else {
          return [...prevDrivers, { id: data.driverId, name: 'Unknown', lat: data.lat, lng: data.lng }];
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected.');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
    });
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded-md">{error}</div>;
  }

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {drivers.map((driver) => (
        <Marker key={driver.id} position={[driver.lat, driver.lng]}>
          <Popup>
            <b>{driver.name}</b>
            <br />
            ID: {driver.id.slice(0, 8)}...
            <br />
            Lat: {driver.lat.toFixed(4)}, Lng: {driver.lng.toFixed(4)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
