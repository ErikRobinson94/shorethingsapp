import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const [tip, setTip] = useState(5);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const total = 20 + tip; // Assume base order is $20 for demo purposes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms of Service before checking out.');
      return;
    }

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100 }), // Convert to cents
      });

      const { clientSecret, orderId } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          navigate(`/track-order/${orderId}`);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      <div className="tip-section">
        <h3>Add a Tip</h3>
        <div className="tip-buttons">
          <button onClick={() => setTip(5)} className={tip === 5 ? 'selected' : ''}>$5 (QUICK)</button>
          <button onClick={() => setTip(10)} className={tip === 10 ? 'selected' : ''}>$10 (QUICKER)</button>
          <button onClick={() => setTip(15)} className={tip === 15 ? 'selected' : ''}>$15 (QUICKEST)</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <label>Card Details</label>
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        
        <div className="tos">
          <input
            type="checkbox"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
          />
          <label>
            I agree to the Terms of Service. Orders cannot be modified after submission.
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={!stripe || !agreed}>
          Pay ${total.toFixed(2)}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
