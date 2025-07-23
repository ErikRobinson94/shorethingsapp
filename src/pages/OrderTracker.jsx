import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import io from 'socket.io-client';
import axios from 'axios';
import '../styles/OrderTracker.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWRyb2JpbnM5NCIsImEiOiJjbWN3OTVpNWcwMnVxMndxN3YwZ2w1MTRmIn0.2rvIa4wcQV2Sox3T9Ruh2g';
const socket = io('https://shorethingsapp.onrender.com');

function OrderTracker() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const customerCoordsRef = useRef(null);

  const { state } = useLocation();
  const storedCoords = localStorage.getItem('customerCoords');
  if (storedCoords) {
    customerCoordsRef.current = JSON.parse(storedCoords);
  }

  const navOrderId = state?.orderId;
  const storedOrderId = localStorage.getItem('latestOrderId');
  const initialOrderId = navOrderId || storedOrderId;

  localStorage.setItem('latestOrderId', initialOrderId);
  const [orderId] = useState(initialOrderId);
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (orderId) {
      const room = `order-${orderId}`;
      socket.emit('joinOrder', room);
      console.log('[SOCKET] Joined room:', room);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`https://shorethingsapp.onrender.com/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!mapContainerRef.current || !customerCoordsRef.current || !order) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [customerCoordsRef.current.lon, customerCoordsRef.current.lat],
      zoom: 14,
    });

    const marker = new mapboxgl.Marker({ color: 'blue' })
      .setLngLat([customerCoordsRef.current.lon, customerCoordsRef.current.lat])
      .addTo(mapRef.current);

    customerMarkerRef.current = marker;
    setMapReady(true);

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [order]);

  useEffect(() => {
    socket.on('driverLocationUpdate', (data) => {
      if (!mapReady || !data?.lat || !data?.lon) return;

      const driverLngLat = [data.lon, data.lat];

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat(driverLngLat);
      } else {
        driverMarkerRef.current = new mapboxgl.Marker({ color: 'red' })
          .setLngLat(driverLngLat)
          .addTo(mapRef.current);
      }

      // Draw line between customer and driver
      if (lineRef.current) {
        mapRef.current.removeLayer('route');
        mapRef.current.removeSource('route');
      }

      const routeGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [customerCoordsRef.current.lon, customerCoordsRef.current.lat],
            driverLngLat,
          ],
        },
      };

      mapRef.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON,
      });

      mapRef.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#888',
          'line-width': 4,
        },
      });

      lineRef.current = routeGeoJSON;
    });

    return () => socket.off('driverLocationUpdate');
  }, [mapReady]);

  return (
    <div className="order-tracker-page">
      <h2>Track Your Order</h2>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default OrderTracker;
