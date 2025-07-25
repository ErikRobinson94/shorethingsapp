// src/pages/OrdersManager.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';

const BASE_URL = API_BASE_URL || 'https://shorethingsapp.onrender.com';
const socket = io(BASE_URL, { transports: ['websocket'] });

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const watchIdRef = useRef(null);
  const activeOrderRef = useRef(null);

  useEffect(() => {
    console.log('[DEBUG] API_BASE_URL:', API_BASE_URL);
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/orders`);
      setOrders(res.data.reverse());
    } catch (err) {
      console.error('[OrdersManager] Error fetching orders:', err);
    }
  };

  const getNextStatus = (current) => {
    if (current === 'placed') return 'en_route';
    if (current === 'en_route') return 'delivered';
    return 'delivered';
  };

  const updateStatus = async (orderId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    try {
      await axios.post(`${BASE_URL}/api/orders/status`, { orderId, status: newStatus });
      socket.emit('orderStatusUpdated', { orderId, status: newStatus }); // NEW: Notify tracker

      if (newStatus === 'en_route') {
        startSendingLocation(orderId);
      } else if (newStatus === 'delivered') {
        stopSendingLocation();
      }

      fetchOrders();
    } catch (err) {
      console.error('[OrdersManager] Error updating status:', err);
    }
  };

  const startSendingLocation = (orderId) => {
    if (!navigator.geolocation) {
      console.error('[GEO] Geolocation not supported');
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    activeOrderRef.current = orderId;
    socket.emit('joinOrder', orderId);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`[GEO] Sending location for order ${orderId}:`, { latitude, longitude });
        socket.emit('driverLocation', { orderId, latitude, longitude });
      },
      (err) => console.error('[GEO ERROR]', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const stopSendingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    activeOrderRef.current = null;
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
                <strong>Location:</strong> Lat {order.location.latitude?.toFixed(5)}, Lon {order.location.longitude?.toFixed(5)}
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
