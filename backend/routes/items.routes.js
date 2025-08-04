const express = require('express');
const router = express.Router();
const Item = require('../models/items');

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    console.error('Failed to get items:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to save item:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

module.exports = router;
