// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CartProvider } from './context/CartContext';

import HomePage from './pages/HomePage';
import LocationPage from './pages/LocationPage';
import MeetPage from './pages/MeetPage';
import ItemsPage from './pages/ItemsPage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import OrderTracker from './pages/OrderTracker';
import ConfirmTowerPage from './pages/ConfirmTowerPage';



const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <CartProvider>
      <Elements stripe={stripePromise}>
        <Router>
          <nav style={{ padding: '10px', background: '#f0f0f0' }}>
            <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
            <Link to="/admin">Admin</Link>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/meet/:id" element={<MeetPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track-order/:id" element={<OrderTracker />} />
            <Route path="/confirm-tower" element={<ConfirmTowerPage />} />

          </Routes>
        </Router>
      </Elements>
    </CartProvider>
  );
}

export default App;
