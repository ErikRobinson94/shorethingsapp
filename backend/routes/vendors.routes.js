const express = require('express');
const router = express.Router();
const Vendor = require('../models/vendors');

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    console.error('Failed to get vendors:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('Failed to get vendor:', err);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// POST a new vendor
router.post('/', async (req, res) => {
  try {
    const newVendor = new Vendor(req.body);
    const saved = await newVendor.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to create vendor:', err);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

module.exports = router;
