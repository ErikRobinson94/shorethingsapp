import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import HomePage from './pages/HomePage';
import LocationPage from './pages/LocationPage';
import MeetPage from './pages/MeetPage';
import ItemsPage from './pages/ItemsPage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import OrdersManager from './pages/OrdersManager';
import ProductManager from './pages/ProductManager';
import OrderTracker from './pages/OrderTracker';
import VendorManager from './pages/VendorManager';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/meet" element={<MeetPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersManager />} />
          <Route path="/product" element={<ProductManager />} />
          <Route path="/track-order/:id" element={<OrderTracker />} />
          <Route path="/vendors" element={<VendorManager />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
