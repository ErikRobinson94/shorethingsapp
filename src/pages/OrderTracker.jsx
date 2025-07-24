import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { io } from 'socket.io-client';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/OrderTracker.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibGF3ZGFsZWF0cyIsImEiOiJjbGcxcDBpbWowNTRrM2VtZ3U4cGtnZW1rIn0.rQ4gQKVuDPo7u7XWgokYfA';

const BACKEND_URL = 'https://shorethingsapp.onrender.com';
const socket = io(BACKEND_URL);

const OrderTracker = () => {
  const { id } = useParams(); // Grab dynamic :id from URL
  const [order, setOrder] = useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);

  useEffect(() => {
    console.log('🧾 [OrderTracker] URL param id:', id);
    if (!id) {
      console.warn('⚠️ [OrderTracker] No order ID found in URL.');
      return;
    }

    socket.emit('joinOrder', `order-${id}`);
    console.log(`[Socket] Emitted joinOrder for room: order-${id}`);

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/${id}`);
        const data = await res.json();
        console.log('[OrderTracker] Order fetched:', data);

        setOrder(data);

        if (data?.location) {
          const lng = data.location.longitude ?? data.location.lon;
          const lat = data.location.latitude ?? data.location.lat;

          if (lng !== undefined && lat !== undefined) {
            setCustomerCoords([lng, lat]);
            console.log('[OrderTracker] Customer location set:', { lat, lng });
          } else {
            console.warn('[OrderTracker] Invalid location data:', data.location);
          }
        }
      } catch (err) {
        console.error('[OrderTracker] Failed to fetch order:', err);
      }
    };

    fetchOrder();

    socket.on('driverLocation', ({ latitude, longitude }) => {
      console.log('[Socket] Driver location received:', { latitude, longitude });
      setDriverCoords([longitude, latitude]);
    });

    return () => {
      socket.off('driverLocation');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (!customerCoords || !mapRef.current) return;

    console.log('[Map] Initializing map with customer coords:', customerCoords);

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: customerCoords,
      zoom: 14
    });

    mapInstanceRef.current = map;

    const customerMarker = new mapboxgl.Marker({ color: 'blue' })
      .setLngLat(customerCoords)
      .addTo(map);
    customerMarkerRef.current = customerMarker;

    return () => {
      if (map) map.remove();
    };
  }, [customerCoords]);

  useEffect(() => {
    if (!mapInstanceRef.current || !driverCoords || !customerCoords) return;

    console.log('[Map] Drawing route from driver to customer:', {
      driverCoords,
      customerCoords
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(driverCoords);
    } else {
      driverMarkerRef.current = new mapboxgl.Marker({ color: 'red' })
        .setLngLat(driverCoords)
        .addTo(mapInstanceRef.current);
    }

    const lineData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [driverCoords, customerCoords]
      }
    };

    if (mapInstanceRef.current.getSource('routeLine')) {
      mapInstanceRef.current.getSource('routeLine').setData(lineData);
    } else {
      mapInstanceRef.current.addSource('routeLine', {
        type: 'geojson',
        data: lineData
      });

      mapInstanceRef.current.addLayer({
        id: 'routeLine',
        type: 'line',
        source: 'routeLine',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 4
        }
      });
    }
  }, [driverCoords, customerCoords]);

  const getStatusText = (status) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'en_route': return 'Driver En Route';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  return (
    <div className="tracker-container">
      <h2>Track Your Order</h2>
      {order ? (
        <>
          <div className="status-bar">
            <div className={`step ${['placed', 'en_route', 'delivered'].includes(order.status) ? 'active' : ''}`}>Placed</div>
            <div className={`step ${['en_route', 'delivered'].includes(order.status) ? 'active' : ''}`}>En Route</div>
            <div className={`step ${order.status === 'delivered' ? 'active' : ''}`}>Delivered</div>
          </div>
          <p className="status-text">Current Status: {getStatusText(order.status)}</p>
        </>
      ) : (
        <p>Loading order details...</p>
      )}
      <div ref={mapRef} className="tracker-map" />
    </div>
  );
};

export default OrderTracker;
