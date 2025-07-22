// ✅ ProductManager.jsx (updated)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/ProductManager.css';

function ProductManager() {
  const [vendors, setVendors] = useState([]);
  const [useNewVendor, setUseNewVendor] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    vendor: '',
    newVendor: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');

  const categoryOptions = ['beach', 'food', 'games'];

  useEffect(() => {
    axios.get('https://shorethingsapp.onrender.com/api/vendors').then((res) => {
      setVendors(res.data);
      if (res.data.length > 0 && !form.vendor) {
        const firstVendor = res.data[0].name || res.data[0];
        setForm((prev) => ({ ...prev, vendor: firstVendor }));
      }
    });
  }, [form.vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    try {
      let finalVendor = form.vendor;
      if (useNewVendor && form.newVendor) {
        await axios.post('https://shorethingsapp.onrender.com/api/vendors', { name: form.newVendor });
        finalVendor = form.newVendor;
      }

      let imagePath = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await axios.post('https://shorethingsapp.onrender.com/api/upload', formData);
        imagePath = uploadRes.data.filename;
      }

      await axios.post('https://shorethingsapp.onrender.com/api/items', {
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        vendor: finalVendor,
        image: imagePath,
      });

      setStatus('✅ Item added successfully!');
      setForm({ name: '', price: '', category: '', vendor: '', newVendor: '', image: '' });
      setImageFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      setStatus('❌ Error submitting item.');
    }
  };

  return (
    <div className="admin-upload">
      <h2>Product Management</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Item name" value={form.name} onChange={handleChange} required />
        <input name="price" placeholder="Price" type="number" step="0.01" value={form.price} onChange={handleChange} required />

        <label>
          Category:
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Select category</option>
            {categoryOptions.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          Vendor:
          {!useNewVendor ? (
            <select name="vendor" value={form.vendor} onChange={handleChange} required>
              {vendors.map((v, idx) => (
                <option key={idx} value={v.name || v}>{v.name || v}</option>
              ))}
            </select>
          ) : (
            <input
              name="newVendor"
              placeholder="New vendor name"
              value={form.newVendor}
              onChange={handleChange}
              required
            />
          )}
        </label>

        <button
          type="button"
          className="toggle-vendor-btn"
          onClick={() => setUseNewVendor((prev) => !prev)}
        >
          {useNewVendor ? '⬅️ Use Existing Vendor' : '➕ Add New Vendor'}
        </button>

        <label>
          Upload Image:
          <input type="file" accept="image/*" onChange={handleFileChange} required />
        </label>

        {preview && <img src={preview} alt="Preview" className="preview" />}

        <button type="submit">Add Item</button>
      </form>

      {status && <p className="status-msg">{status}</p>}
    </div>
  );
}

export default ProductManager;
