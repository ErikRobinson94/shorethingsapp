import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { io } from 'socket.io-client';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/LocationPage.css';

const socket = io('https://shorethingsapp.onrender.com');

function LocationPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!coords) return;

    console.log('🗺️ [Mapbox] Initializing map with coordinates:', coords);

    mapboxgl.accessToken = 'pk.eyJ1IjoiZWRyb2JpbnM5NCIsImEiOiJjbWN3OTVpNWcwMnVxMndxN3YwZ2w1MTRmIn0.2rvIa4wcQV2Sox3T9Ruh2g';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [coords.lon, coords.lat],
      zoom: 15,
    });

    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker';

    const pinEl = document.createElement('div');
    pinEl.className = 'pin';
    markerEl.appendChild(pinEl);

    markerRef.current = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
      .setLngLat([coords.lon, coords.lat])
      .addTo(mapRef.current);

    return () => {
      console.log('♻️ [Mapbox] Cleaning up map and marker');
      if (markerRef.current) markerRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [coords]);

  const handleMarkLocation = () => {
    console.log('📍 [Geo] Attempting to get user location...');
    setErrorMsg('');
    setLoading(true);

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      console.warn('⚠️ [Geo] Geolocation unsupported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lon: longitude };
        setCoords(location);
        setLoading(false);

        // Save to localStorage
        localStorage.setItem('userCoords', JSON.stringify(location));
        localStorage.setItem('customerCoords', JSON.stringify(location));
        console.log('✅ [Geo] Coordinates saved to localStorage:', location);

        const orderId = localStorage.getItem('latestOrderId');
        if (!orderId) {
          console.warn('⚠️ [Socket] No orderId found — skipping emit. Location will be sent later.');
          return;
        }

        const payload = { orderId, latitude, longitude };
        socket.emit('customerLocation', payload);
        console.log('📡 [Socket] Emitted customerLocation with orderId:', payload);
      },
      (error) => {
        console.error('❌ [Geo] Geolocation error:', error);
        setErrorMsg('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  };

  const handleConfirmTowerClick = () => {
    console.log('➡️ [Nav] Navigating to ConfirmTowerPage...');
    navigate('/confirm-tower');
  };

  useEffect(() => {
    console.log('🚀 [Page Load] LocationPage mounted.');
    return () => {
      console.log('🧹 [Page Unload] Cleaning up LocationPage.');
    };
  }, []);

  return (
    <div className="location-page">
      <h1>Mark Your Location</h1>

      <button onClick={handleMarkLocation} disabled={loading}>
        {loading ? 'Locating...' : 'Use My Location'}
      </button>

      {errorMsg && <p className="error">{errorMsg}</p>}

      <div id="map-container" ref={mapContainerRef}></div>

      {coords && (
        <>
          <p className="coords">
            📍 <strong>Lat:</strong> {coords.lat.toFixed(5)} | <strong>Lon:</strong> {coords.lon.toFixed(5)}
          </p>
          <p className="instruction">This will be your delivery location.</p>
          <button className="add-items-btn" onClick={handleConfirmTowerClick}>
            <span className="icon">➡️</span> Select the Closest Lifeguard Tower
          </button>
        </>
      )}
    </div>
  );
}

export default LocationPage;
