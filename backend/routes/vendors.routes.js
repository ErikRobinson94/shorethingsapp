const express = require('express');
const Vendor = require('../models/vendors'); // Mongo model

const router = express.Router();

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const updated = vendors.map(vendor => {
      const img = vendor.image || '';
      if (img && !img.startsWith('http')) {
        return { ...vendor._doc, image: `${baseUrl}${img}` };
      }
      return vendor._doc;
    });

    res.json(updated);
  } catch (err) {
    console.error('❌ Error fetching vendors from Mongo:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST a new vendor
router.post('/', async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name || !image) {
      return res.status(400).json({ error: 'Missing name or image' });
    }

    const newVendor = new Vendor({ name, image });
    await newVendor.save();

    res.status(201).json(newVendor);
  } catch (err) {
    console.error('❌ Error adding vendor:', err);
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

// DELETE vendor by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Vendor.findByIdAndDelete(id);
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (err) {
    console.error('❌ Error deleting vendor:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;
