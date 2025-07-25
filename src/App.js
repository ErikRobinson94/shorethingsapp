// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LocationPage from './pages/LocationPage';
import MeetPage from './pages/MeetPage';
import ItemsPage from './pages/ItemsPage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import { CartProvider } from './context/CartContext';
import OrderTracker from './pages/OrderTracker';

function App() {
  return (
    <CartProvider>
      <Router>
        {/* Simple nav bar with Admin link */}
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
          <Route path="/track-order/:id" element={<OrderTracker />} /> {/* ✅ dynamic route */}
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
