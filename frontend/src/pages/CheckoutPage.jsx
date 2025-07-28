import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import '../styles/CheckoutPage.css';

const BACKEND_URL = 'https://shorethingsapp.onrender.com';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [tipAmount, setTipAmount] = useState(0);

  const baseTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = discountCode === 'TESTORDER' ? 0.01 : baseTotal + tipAmount;

  const handleConfirmOrder = async () => {
    const coords = JSON.parse(localStorage.getItem('userCoords'));
    console.log('📦 [Checkout] Submitting order with coords:', coords);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/orders`, {
        items: cart,
        total: totalPrice,
        tip: tipAmount,
        discountCode,
        timestamp: Date.now(),
        status: 'placed',
        location: coords || null,
      });

      const orderId = response.data.id || response.data._id;
      if (orderId) {
        localStorage.setItem('latestOrderId', orderId);
        console.log('✅ [Checkout] Order confirmed, ID saved to localStorage:', orderId);
      }

      clearCart();
      navigate(`/track-order/${response.data.id}`);
    } catch (err) {
      console.error('❌ [Checkout] Order submission failed:', err);
    }
  };

  return (
    <div className="checkout-page">
      <h2>🧾 Review Your Order</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cart.map((item, i) => (
              <li key={i}>
                {item.name} — ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <hr />
          <p><strong>Add a Tip:</strong></p>
          <div className="tip-buttons">
            <button onClick={() => setTipAmount(5)}>$5 — QUICK</button>
            <button onClick={() => setTipAmount(10)}>$10 — QUICKER</button>
            <button onClick={() => setTipAmount(15)}>$15 — QUICKEST</button>
          </div>
          <p><strong>Total:</strong> ${totalPrice.toFixed(2)}</p>
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Enter discount code"
          />
          <p style={{ fontSize: '0.9rem', color: 'gray', marginTop: '10px' }}>
            Orders cannot be modified and delivery times are not guaranteed.
          </p>
          <button onClick={handleConfirmOrder} disabled={cart.length === 0}>
            ✅ Confirm Order
          </button>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;
