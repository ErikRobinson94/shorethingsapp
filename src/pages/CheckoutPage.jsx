import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, vendor } = location.state || {};
  const [customerLocation, setCustomerLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCustomerLocation(loc);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }, []);

  const handlePlaceOrder = async () => {
    try {
      const orderId = `order-${Date.now()}`;

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/orders`, {
        vendor,
        items: cartItems,
        location: customerLocation,
        orderId,
      });

      localStorage.setItem('orderId', orderId);
      console.log('✅ Order placed with orderId:', orderId);

      navigate('/track-order');
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Checkout</h2>
      <ul>
        {cartItems && cartItems.map((item, i) => (
          <li key={i}>
            {item.name} - ${item.price}
          </li>
        ))}
      </ul>
      <button onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
}

export default CheckoutPage;
