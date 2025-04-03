'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  theme?: string;
}

export default function Map({ latitude, longitude, city, country, theme }: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Fix for marker icons in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: '/marker-icon.png',
      iconRetinaUrl: '/marker-icon-2x.png',
      shadowUrl: '/marker-shadow.png',
    });
  }, []);

  if (!isClient) {
    return <div className="h-full w-full rounded-lg overflow-hidden border bg-muted animate-pulse" />;
  }

  // Map style URLs
  const mapStyle = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
    (theme === 'dark' ? ' &copy; <a href="https://carto.com/attributions">CARTO</a>' : '');

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border relative">
      <div className="absolute inset-0">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: theme === 'dark' ? '#242424' : '#fff' }}
          className={theme === 'dark' ? 'dark' : ''}
        >
          <TileLayer
            attribution={attribution}
            url={mapStyle}
            className={theme === 'dark' ? 'dark-tiles' : ''}
          />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div className={theme === 'dark' ? 'text-white bg-gray-800 p-2 rounded' : 'p-2'}>
                {city ? `${city}, ${country}` : country || 'Your Location'}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
} 