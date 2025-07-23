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
    };
  }, [coords]);

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        const newCoords = { lat, lon };
        setCoords(newCoords);
        localStorage.setItem('customerCoords', JSON.stringify(newCoords));
        setLoading(false);
      },
      (error) => {
        setErrorMsg('Failed to get location.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="location-page">
      <h2>Mark Your Location</h2>
      <button onClick={handleLocation} disabled={loading}>
        {loading ? 'Locating...' : 'Use My Location'}
      </button>
      {errorMsg && <p className="error">{errorMsg}</p>}
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default LocationPage;
