const express = require('express');
const router = express.Router();
const Order = require('../models/orders');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error('Failed to get orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Failed to get order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST a new order
router.post('/', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const saved = await newOrder.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to save order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json(updated);
  } catch (err) {
    console.error('Failed to update status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
