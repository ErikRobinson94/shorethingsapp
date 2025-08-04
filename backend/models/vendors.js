// models/vendors.js

const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL to image
    required: false,
  },
  location: {
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
  },
  description: {
    type: String,
    required: false,
  }
});

module.exports = mongoose.model('vendors', vendorSchema);
