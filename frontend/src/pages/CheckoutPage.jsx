import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const { selectedItems = [], orderId, customerLocation } = location.state || {};

  const [subtotal, setSubtotal] = useState(0);
  const [tip, setTip] = useState(0);
  const [agree, setAgree] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const total = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setSubtotal(total);
  }, [selectedItems]);

  const handleTipChange = (e) => {
    const value = parseFloat(e.target.value);
    setTip(isNaN(value) ? 0 : value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !agree) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.error(error);
      setProcessing(false);
      return;
    }

    const total = subtotal + tip;

    // Navigate to OrderTrackerPage with all relevant data
    navigate('/order-tracker', {
      state: {
        selectedItems,
        subtotal,
        tip,
        total,
        orderId,
        customerLocation,
        paymentMethodId: paymentMethod.id
      }
    });
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {selectedItems.map((item, index) => (
        <div key={index} className="item-row">
          <span>{item.name} x {item.quantity}</span>
          <span>${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      <hr />
      <div className="summary-row">
        <span>Subtotal:</span>
        <strong>${subtotal.toFixed(2)}</strong>
      </div>
      <div className="summary-row">
        <label htmlFor="tip">Tip: $</label>
        <input
          id="tip"
          type="number"
          value={tip}
          onChange={handleTipChange}
          step="0.01"
          min="0"
        />
      </div>
      <div className="summary-row total">
        <span>Total:</span>
        <strong>${(subtotal + tip).toFixed(2)}</strong>
      </div>

      <div className="card-section">
        <CardElement />
      </div>

      <div className="agreement">
        <input
          type="checkbox"
          checked={agree}
          onChange={() => setAgree(!agree)}
        />
        <span>I agree to the terms and conditions.</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!stripe || !agree || processing}
        className="submit-btn"
      >
        {processing ? 'Processing...' : 'Submit Order'}
      </button>
    </div>
  );
};

export default CheckoutPage;
