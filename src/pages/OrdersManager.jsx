// src/pages/OrdersManager.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';

// Hard fallback in case API_BASE_URL isn't set correctly
const BASE_URL =
  (typeof API_BASE_URL === 'string' && API_BASE_URL.trim()) ||
  'https://shorethingsapp.onrender.com';

// Use the same base for sockets
const socket = io(BASE_URL, { transports: ['websocket'] });

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const watchIdRef = useRef(null);
  const activeOrderRef = useRef(null);

  useEffect(() => {
    console.log('[DEBUG] API_BASE_URL:', API_BASE_URL);
    console.log('[DEBUG] RESOLVED BASE_URL:', BASE_URL);

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    const url = `${BASE_URL}/api/orders`;
    try {
      console.log('[DEBUG] Fetching orders from:', url);
      const res = await axios.get(url);
      const data = Array.isArray(res.data) ? [...res.data].reverse() : [];
      setOrders(data);
    } catch (err) {
      const status = err?.response?.status;
      console.error(`[OrdersManager] Error fetching orders (status: ${status || 'n/a'}):`, err);
    }
  };

  const getNextStatus = (current) => {
    if (current === 'placed') return 'en_route';
    if (current === 'en_route') return 'delivered';
    return 'delivered';
  };

  const updateStatus = async (orderId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    const url = `${BASE_URL}/api/orders/status`;

    try {
      console.log('[DEBUG] Updating status at:', url, { orderId, newStatus });
      await axios.post(url, { orderId, status: newStatus });

      if (newStatus === 'en_route') {
        console.log('[STATUS] Marked en_route, starting GPS tracking...');
        startSendingLocation(orderId);
      }

      fetchOrders();
    } catch (err) {
      const status = err?.response?.status;
      console.error(`[OrdersManager] Error updating status (status: ${status || 'n/a'}):`, err);
    }
  };

  const startSendingLocation = (orderId) => {
    if (!navigator.geolocation) {
      console.error('[GEO] Geolocation not supported');
      return;
    }

    if (watchIdRef.current !== null) {
      console.log('[GEO] Clearing previous GPS watch...');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    activeOrderRef.current = orderId;
    socket.emit('joinOrder', orderId);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[GEO] ${timestamp} — Emitting location:`, { latitude, longitude, orderId });
        socket.emit('driverLocation', { orderId, latitude, longitude });
      },
      (err) => console.error('[GEO ERROR]', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  return (
    <div>
      <h2>📦 Incoming Orders</h2>
      <ul>
        {orders.map((order, idx) => (
          <li key={order._id || order.id} style={{ marginBottom: '20px' }}>
          <strong>Order #{orders.length - idx}</strong>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} — ${item.price.toFixed(2)}
                </li>
              ))}
            </ul>
            <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
            <p><strong>Time:</strong> {new Date(order.timestamp).toLocaleString()}</p>
            {order.location && (
              <p>
                <strong>Location:</strong>{' '}
                Lat {order.location.lat?.toFixed(5) || order.location.latitude?.toFixed(5)},{' '}
                Lon {order.location.lon?.toFixed(5) || order.location.longitude?.toFixed(5)}
              </p>
            )}
            <p>
              <strong>Status:</strong> {order.status}{' '}
              {order.status !== 'delivered' && (
                <button onClick={() => updateStatus(order.id || order._id, order.status)}>
                  Mark as {getNextStatus(order.status)}
                </button>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrdersManager;
