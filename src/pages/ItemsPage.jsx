import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ItemsPage.css';

function ItemsPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [clickedItemId, setClickedItemId] = useState(null);

  useEffect(() => {
    fetch('https://shorethingsapp.onrender.com/api/vendors')
      .then(res => res.json())
      .then(setVendors);

    // ✅ Fix here: previously pointed to /api/items which doesn’t exist
    fetch('https://shorethingsapp.onrender.com/api/products')
      .then(res => res.json())
      .then(setItems);
  }, []);

  const handleVendorClick = (vendor) => {
    setSelectedVendor(vendor);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    setClickedItemId(item.id);
    setTimeout(() => setClickedItemId(null), 800);
  };

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  return (
    <div className="items-page">
      <h1>{selectedVendor ? `Items from ${selectedVendor.name}` : 'Select a Vendor'}</h1>

      {!selectedVendor ? (
        <div className="category-grid scrollable">
          {vendors.map((vendor, idx) => (
            <div
              key={idx}
              className="category-card"
              onClick={() => handleVendorClick(vendor)}
            >
              <img
                src={vendor.image}
                alt={vendor.name}
              />
              <p>{vendor.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button className="back-btn" onClick={() => setSelectedVendor(null)}>← Back to Vendors</button>
          <div className="items-grid scrollable">
            {items
              .filter(item => item.vendor === selectedVendor.name)
              .map(item => (
                <div key={item.id} className="item-card">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>${item.price.toFixed(2)}</p>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={clickedItemId === item.id ? 'added' : ''}
                    >
                      {clickedItemId === item.id ? '✔ Added' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      <button className="continue-btn" onClick={handleCheckoutClick}>
        Continue to Checkout →
      </button>
    </div>
  );
}

export default ItemsPage;
