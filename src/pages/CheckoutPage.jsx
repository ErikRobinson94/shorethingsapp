// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const location = JSON.parse(localStorage.getItem('customerLocation'));
    const order = JSON.parse(localStorage.getItem('order'));

    if (!location || !order) {
      alert('Missing order or location data');
      return;
    }

    const payload = {
      customerName,
      customerPhone,
      order,
      location
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, payload);
      const orderId = response.data.orderId;

      console.log('[CHECKOUT] Order response:', response.data);

      // ✅ Save orderId for tracker page
      localStorage.setItem('latestOrderId', orderId);

      // Redirect to tracker
      navigate('/track-order');
    } catch (err) {
      console.error('[CHECKOUT] Order submission failed:', err);
      alert('Order submission failed');
    }
  };

  return (
    <div className="container">
      <h2>Enter Your Info</h2>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <label>Phone:</label>
        <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        <button type="submit">Place Order</button>
      </form>
    </div>
  );
};

export default CheckoutPage;
