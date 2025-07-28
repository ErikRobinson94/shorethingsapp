// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const [tip, setTip] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = (subtotal + Number(tip)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !agreed) return;

    setLoading(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const orderData = {
      items: cart,
      subtotal,
      tip,
      total,
      paymentMethodId: paymentMethod.id,
    };

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (data.success) {
      clearCart();
      navigate(`/track-order/${data.orderId}`);
    } else {
      alert(data.message || 'Payment failed');
    }

    setLoading(false);
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {cart.map((item, i) => (
        <div key={i} className="checkout-item">
          {item.name} x ${item.price.toFixed(2)}
        </div>
      ))}
      <hr />
      <div className="checkout-summary">
        <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
        <p>
          Tip: $
          <input
            type="number"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            style={{ width: '60px' }}
          />
        </p>
        <p><strong>Total: ${total}</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="card-section">
          <CardElement />
        </div>

        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I agree to the terms and conditions.
        </label>

        <button type="submit" disabled={!agreed || loading || !stripe}>
          {loading ? 'Processing...' : 'Submit Order'}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
