// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const [tip, setTip] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const totalWithoutTip = (cart || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWithTip = totalWithoutTip + Number(tip);

  const handleTipChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) setTip(Number(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed || cart.length === 0) return;

    const orderData = {
      cart,
      tip,
      total: totalWithTip,
      timestamp: new Date().toISOString(),
    };

    // Save order data to localStorage
    localStorage.setItem('order', JSON.stringify(orderData));

    // Clear cart and navigate to tracker
    clearCart();
    navigate('/order-tracker');
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="checkout-items">
        {(cart || []).map((item, index) => (
          <div key={index} className="checkout-item">
            <span>{item.name}</span>
            <span>{item.quantity} x ${item.price.toFixed(2)}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="checkout-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${totalWithoutTip.toFixed(2)}</span>
        </div>

        <div className="summary-row">
          <label htmlFor="tip">Tip: $</label>
          <input
            id="tip"
            type="number"
            value={tip}
            onChange={handleTipChange}
            min="0"
            step="1"
            className="tip-input"
          />
        </div>

        <div className="summary-row total">
          <strong>Total:</strong>
          <strong>${totalWithTip.toFixed(2)}</strong>
        </div>

        <div className="agreement">
          <label>
            <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} />
            I agree to the terms and conditions.
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!agreed || cart.length === 0}
          className="submit-btn"
        >
          Submit Order
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
