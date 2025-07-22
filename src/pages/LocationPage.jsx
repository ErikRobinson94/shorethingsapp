import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { io } from 'socket.io-client';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/LocationPage.css';

const socket = io('http://localhost:5000');

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
      if (markerRef.current) markerRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [coords]);

  const handleMarkLocation = () => {
    setErrorMsg('');
    setLoading(true);

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lon: longitude };
        setCoords(location);
        setLoading(false);

        const orderId = localStorage.getItem('latestOrderId');
        if (!orderId) {
          console.warn('⚠️ No orderId found in localStorage.');
          return;
        }

        const payload = { orderId, latitude, longitude };

        // ✅ Corrected: emit as customer location
        socket.emit('customerLocation', payload);
        console.log('📡 Emitted customerLocation:', payload);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setErrorMsg('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  };

  const handleAddItemsClick = () => {
    navigate('/items');
  };

  return (
    <div className="location-page">
      <h1>Mark Your Location</h1>
      <button onClick={handleMarkLocation} disabled={loading}>
        {loading ? 'Locating...' : 'Mark My Location'}
      </button>
      {errorMsg && <p className="error">{errorMsg}</p>}

      <div id="map-container" ref={mapContainerRef}></div>

      {coords && (
        <p className="coords">
          📍 <strong>Lat:</strong> {coords.lat.toFixed(5)} | <strong>Lon:</strong> {coords.lon.toFixed(5)}
        </p>
      )}

      <button className="add-items-btn" onClick={handleAddItemsClick}>
        <span className="icon">➕</span> Add Items to Your Order →
      </button>
    </div>
  );
}

export default LocationPage;
