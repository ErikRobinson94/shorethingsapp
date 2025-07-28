import React, { useState } from 'react';
import ProductManager from './ProductManager';
import VendorManager from './VendorManager';
import OrdersManager from './OrdersManager';

const AdminDashboard = () => {
  const [selectedSection, setSelectedSection] = useState('product');

  const renderSection = () => {
    switch (selectedSection) {
      case 'product':
        return <ProductManager />;
      case 'vendor':
        return <VendorManager />;
      case 'orders':
        return <OrdersManager />;
      default:
        return <ProductManager />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <aside style={{ width: '250px', backgroundColor: '#0d1b2a', color: '#fff', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px' }}>Admin Panel</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li
            onClick={() => setSelectedSection('product')}
            style={{
              cursor: 'pointer',
              marginBottom: '20px',
              color: selectedSection === 'product' ? '#66fcf1' : '#fff',
            }}
          >
            🛒 Product Management
          </li>
          <li
            onClick={() => setSelectedSection('vendor')}
            style={{
              cursor: 'pointer',
              marginBottom: '20px',
              color: selectedSection === 'vendor' ? '#66fcf1' : '#fff',
            }}
          >
            🗂 Vendor Management
          </li>
          <li
            onClick={() => setSelectedSection('orders')}
            style={{
              cursor: 'pointer',
              color: selectedSection === 'orders' ? '#66fcf1' : '#fff',
            }}
          >
            📦 Orders
          </li>
        </ul>
      </aside>

      <main style={{ flexGrow: 1, padding: '40px' }}>
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminDashboard;
