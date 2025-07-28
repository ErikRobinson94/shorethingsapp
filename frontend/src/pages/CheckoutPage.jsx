// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import '../styles/CheckoutPage.css';

const stripePromise = loadStripe('pk_live_51IjUQ9GqiLUJNfkCPG6MmpR3Lxph5bx3jgScGiEvKGpzuYsjRVFJute2d97Yz9Fj3J5tzzrhYDp8HuT4EIMOqKzV00pTnJO1SV');

const CheckoutForm = () => {
  const { cartItems, location, clearCart } = useCart();
  const [tip, setTip] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalAmount = total + tip;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !agreed || processing) return;

    setProcessing(true);

    const response = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(finalAmount * 100) }),
    });

    const { clientSecret } = await response.json();
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (result.error) {
      alert(result.error.message);
      setProcessing(false);
    } else if (result.paymentIntent.status === 'succeeded') {
      const placeOrderRes = await fetch(`${import.meta.env.VITE_SERVER_URL || ''}/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          location,
          tip,
          total: finalAmount
        }),
      });
      const { orderId } = await placeOrderRes.json();
      clearCart();
      navigate(`/track-order/${orderId}`);
    }
  };

  return (
    <form className="checkout-page" onSubmit={handleSubmit}>
      <h2>Checkout</h2>

      <h3>Add a Tip</h3>
      <div className="tip-buttons">
        {[5, 10, 15].map((amt) => (
          <button
            type="button"
            key={amt}
            className={tip === amt ? 'active' : ''}
            onClick={() => setTip(amt)}
          >
            ${amt} {amt === 5 ? '(QUICK)' : amt === 10 ? '(QUICKER)' : '(QUICKEST)'}
          </button>
        ))}
      </div>

      <h4>Card Details</h4>
      <div className="card-element-wrapper">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>

      <div className="terms">
        <input
          type="checkbox"
          id="tos"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <label htmlFor="tos">
          I agree to the Terms of Service. Orders cannot be modified after submission.
        </label>
      </div>

      <button type="submit" disabled={!stripe || !agreed || processing}>
        {processing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </button>
    </form>
  );
};

const CheckoutPage = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default CheckoutPage;
