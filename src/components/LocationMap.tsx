'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

function LocationMapComponent({ latitude, longitude, city, country }: LocationMapProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    // Import Leaflet CSS only on the client side
    import('leaflet/dist/leaflet.css');
  }, []);

  // Import Leaflet components only on the client side
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');
  
  // Fix for default marker icon
  const icon = L.icon({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  // Map style URLs
  const mapStyle = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className={currentTheme === 'dark' ? 'dark' : ''}
      >
        <TileLayer
          attribution={attribution}
          url={mapStyle}
          className={currentTheme === 'dark' ? 'dark-tiles' : ''}
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div className={currentTheme === 'dark' ? 'text-white bg-gray-800 p-2 rounded' : 'p-2'}>
              {city ? `${city}, ${country}` : country || 'Your Location'}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// Export a dynamic component with SSR disabled
export const LocationMap = dynamic(
  () => Promise.resolve(LocationMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div 
        style={{ height: '100%', width: '100%' }}
        className="animate-pulse bg-muted rounded-md"
      />
    )
  }
); 