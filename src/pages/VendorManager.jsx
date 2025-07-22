// ✅ VendorManager.jsx (updated)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/VendorManager.css';

function VendorManager() {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const addVendor = async () => {
    if (!newVendor.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/vendors', { name: newVendor });
      setNewVendor('');
      setStatus('✅ Vendor added!');
      fetchVendors();
    } catch (err) {
      console.error('Error adding vendor:', err);
      setStatus('❌ Failed to add vendor.');
    }
  };

  const deleteVendor = async (name) => {
    try {
      const updatedVendors = vendors.filter((v) => (v.name || v) !== name);
      await axios.post('http://localhost:5000/api/vendors', { name: '__overwrite__', vendors: updatedVendors });
      setStatus('🗑️ Vendor deleted.');
      fetchVendors();
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setStatus('❌ Failed to delete vendor.');
    }
  };

  return (
    <div className="vendor-manager">
      <h2>Vendor Management</h2>
      <input
        type="text"
        placeholder="New vendor name"
        value={newVendor}
        onChange={(e) => setNewVendor(e.target.value)}
      />
      <button onClick={addVendor}>Add Vendor</button>

      <ul>
        {vendors.map((vendor, idx) => {
          const name = vendor.name || vendor;
          return (
            <li key={idx}>
              {name} <button onClick={() => deleteVendor(name)}>Delete</button>
            </li>
          );
        })}
      </ul>

      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}

export default VendorManager;
