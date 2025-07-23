import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext'; // ✅ only useCart
import '../styles/CheckoutPage.css'; // ✅ your own stylesheet

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleConfirmOrder = async () => {
    const coords = JSON.parse(localStorage.getItem('userCoords'));

    try {
      const response = await axios.post('/api/orders', {
        items: cart,
        total: totalPrice,
        timestamp: Date.now(),
        status: 'placed',
        location: coords || null,
      });

      clearCart();

      // ✅ Extract and persist order ID for use in LocationPage
      const orderId = response.data.id || response.data._id;
      if (orderId) {
        localStorage.setItem('latestOrderId', orderId);
        console.log('✅ Order confirmed, ID saved to localStorage:', orderId);
      } else {
        console.warn('⚠️ No orderId found in response:', response.data);
      }

      // ✅ Navigate to track page with order ID
      navigate('/track-order', { state: { orderId } });

    } catch (err) {
      console.error('❌ Order submission failed:', err);
    }
  };

  return (
    <div className="checkout-page">
      <h2>🧾 Review Your Order</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cart.map((item, i) => (
            <li key={i}>
              {item.name} — ${item.price.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
      <p><strong>Total:</strong> ${totalPrice.toFixed(2)}</p>
      <button onClick={handleConfirmOrder} disabled={cart.length === 0}>
        ✅ Confirm Order
      </button>
    </div>
  );
};

export default CheckoutPage;
