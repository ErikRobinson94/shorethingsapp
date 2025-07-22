import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import io from 'socket.io-client';
import axios from 'axios';
import '../styles/OrderTracker.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoiZWRyb2JpbnM5NCIsImEiOiJjbWN3OTVpNWcwMnVxMndxN3YwZ2w1MTRmIn0.2rvIa4wcQV2Sox3T9Ruh2g';
const socket = io('http://localhost:5000');

function OrderTracker() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const lineRef = useRef(null);
  const customerCoordsRef = useRef(null);

  const { state } = useLocation();
  const initialOrderId = state?.orderId || localStorage.getItem('latestOrderId');
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
        const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
        setOrder(res.data);
        localStorage.setItem('latestOrderId', res.data.id || res.data._id);
        console.log('[ORDER] Loaded:', res.data);
      } catch (err) {
        console.error('[ORDER] Fetch error:', err);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order?.location || mapRef.current) return;

    const { latitude, longitude } = order.location;
    console.log('[MAP] Initializing at customer location:', latitude, longitude);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [longitude, latitude],
      zoom: 14,
    });

    map.on('load', () => {
      console.log('[MAP] Loaded and ready.');
      setMapReady(true);

      customerCoordsRef.current = [longitude, latitude];

      const el = document.createElement('div');
      el.className = 'customer-marker';
      el.style.width = '26px';
      el.style.height = '26px';
      el.style.backgroundColor = 'black';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 0 6px rgba(0,0,0,0.4)';
      el.style.border = '2px solid white';

      customerMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup().setText('📍 Customer'))
        .addTo(map);
    });

    mapRef.current = map;
  }, [order]);

  useEffect(() => {
    const handleDriverLocation = (loc) => {
      console.log('[SOCKET] Driver location received:', loc);
      if (!loc || !loc.latitude || !loc.longitude) return;

      setDriverLocation(loc);

      setOrder((prev) => {
        if (!prev || prev.status === 'en_route' || prev.status === 'delivered') return prev;
        return { ...prev, status: 'en_route' };
      });
    };

    socket.on('driverLocation', handleDriverLocation);
    return () => socket.off('driverLocation', handleDriverLocation);
  }, [orderId]);

  useEffect(() => {
    if (!driverLocation || !mapRef.current || !mapReady || !customerCoordsRef.current) return;

    const { latitude, longitude } = driverLocation;
    const map = mapRef.current;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([longitude, latitude]);
    } else {
      driverMarkerRef.current = new mapboxgl.Marker({ color: 'green' })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup().setText('🚗 Driver'))
        .addTo(map);
    }

    const routeData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [customerCoordsRef.current, [longitude, latitude]],
      },
    };

    if (lineRef.current && map.getSource('route')) {
      map.getSource('route').setData(routeData);
    } else {
      if (map.getSource('route')) map.removeLayer('route') && map.removeSource('route');
      map.addSource('route', { type: 'geojson', data: routeData });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b9ddd', 'line-width': 4 },
      });
      lineRef.current = true;
    }

    map.flyTo({ center: [longitude, latitude], zoom: 15 });
  }, [driverLocation, mapReady]);

  return (
    <div className="order-page">
      <h2>📦 Track Your Order</h2>

      {order ? (
        <>
          <p><strong>Status:</strong> {order.status}</p>

          <div className="order-steps">
            <span className={order.status === 'placed' ? 'active' : ''}>Waiting</span>
            <span className={order.status === 'en_route' ? 'active' : ''}>En Route</span>
            <span className={order.status === 'delivered' ? 'active' : ''}>Delivered</span>
          </div>

          <div ref={mapContainerRef} className="map-container" />

          <div className="order-summary">
            <ul>
              {order.items?.map((item, i) => (
                <li key={i}>{item.name} — ${item.price.toFixed(2)}</li>
              ))}
            </ul>
            <p>
              <strong>Total:</strong> $
              {order.items?.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </p>
          </div>
        </>
      ) : (
        <p>Loading order details...</p>
      )}
    </div>
  );
}

export default OrderTracker;
