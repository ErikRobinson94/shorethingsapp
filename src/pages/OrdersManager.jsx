// src/pages/OrdersManager.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';

const BASE_URL = API_BASE_URL || 'https://shorethingsapp.onrender.com';
const socket = io(BASE_URL, { transports: ['websocket'] });

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const activeOrderRef = useRef(null);
  const mockIntervalRef = useRef(null);

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
    console.log(`[DEBUG] Updating order ${orderId} from ${currentStatus} to ${newStatus}`);

    try {
      await axios.post(`${BASE_URL}/api/orders/status`, { orderId, status: newStatus });
      socket.emit('orderStatusUpdated', { orderId, status: newStatus });

      if (newStatus === 'en_route') {
        startMockDriverLocation(orderId);
      } else if (newStatus === 'delivered') {
        stopMockDriverLocation();
      }

      await fetchOrders();
    } catch (err) {
      console.error('[OrdersManager] Error updating status:', err);
    }
  };

  /**
   * Mock driver location in El Segundo for testing
   */
  const startMockDriverLocation = (orderId) => {
    console.log('[MOCK GEO] Starting simulated driver location for order:', orderId);

    stopMockDriverLocation(); // Clear any previous mock interval
    activeOrderRef.current = orderId;
    socket.emit('joinOrder', orderId);

    let step = 0;
    const baseLat = 33.9164;
    const baseLon = -118.4042;

    mockIntervalRef.current = setInterval(() => {
      const lat = baseLat + (step * 0.0001);
      const lon = baseLon + (step * 0.0001);
      console.log(`[MOCK GEO] Emitting location step ${step}:`, { lat, lon });

      socket.emit('driverLocation', { orderId, latitude: lat, longitude: lon });
      step++;
      if (step > 20) stopMockDriverLocation();
    }, 3000);
  };

  const stopMockDriverLocation = () => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
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
                <button
                  onClick={() => updateStatus(order.id || order._id, order.status)}
                  style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
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
