// models/items.js

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: String,
    required: true, // This should match the vendor name
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // URL to image
    required: false,
  },
  description: {
    type: String,
    required: false,
  }
});

module.exports = mongoose.model('items', itemSchema);
