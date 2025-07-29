import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [tip, setTip] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const total = Math.round((subtotal + Number(tip)) * 100);

  const handleTipSelect = (amount) => setTip(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!stripe || !elements) return;

    try {
      // 1. Create payment intent
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      const { clientSecret, orderId } = await res.json();
      const card = elements.getElement(CardElement);

      // 2. Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name, email, phone },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // 3. Send order to backend
      const location = JSON.parse(localStorage.getItem('location')) || {};
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          items: cart,
          total: subtotal + Number(tip),
          tip,
          name,
          email,
          phone,
          notes,
          location,
          status: 'placed',
        }),
      });

      clearCart();
      navigate(`/track-order/${orderId}`, {
        state: {
          orderId,
          name,
          email,
          phone,
          notes,
          tip,
          cart,
        },
      });
    } catch (err) {
      setError('Payment failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {cart.map((item, i) => (
        <div key={i} className="checkout-item">
          <span>{item.name}</span>
          <span>${item.price.toFixed(2)}</span>
        </div>
      ))}

      <div className="subtotal">
        <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
      </div>

      <div className="tip-section">
        <label>Tip:</label>
        <div className="tip-buttons">
          {[5, 10, 15].map((amt) => (
            <button
              key={amt}
              className={tip === amt ? 'selected' : ''}
              onClick={() => handleTipSelect(amt)}
              type="button"
            >
              {amt === 5 ? 'Quick' : amt === 10 ? 'Quicker' : 'Quickest'} (${amt})
            </button>
          ))}
        </div>
      </div>

      <div className="total-line">
        <strong>Total:</strong> ${(subtotal + Number(tip)).toFixed(2)}
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="form-grid-full"
          />
          <textarea
            placeholder="Order notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-grid-full"
          />
        </div>

        <div className="stripe-card">
          <CardElement />
        </div>

        <div className="terms">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
            required
          />
          <span>I agree to the terms and conditions.</span>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          className="checkout-button"
          disabled={!agree || !stripe || loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;

//
