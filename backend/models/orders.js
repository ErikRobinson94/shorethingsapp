// models/orders.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, required: true, default: 'placed' },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  tip: { type: Number, required: false },
  discountCode: { type: String, required: false },
  location: {
    latitude: Number,
    longitude: Number,
  },
  lifeguardTower: { type: String },
  photo: { type: String },
  name: { type: String },
  phone: { type: String },
  email: { type: String },
  stripeId: { type: String },
  trackerUrl: { type: String },
});

module.exports = mongoose.model('Order', orderSchema);
