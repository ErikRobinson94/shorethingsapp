const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Use Render's PORT if available, fallback to 5000 locally
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const getFile = (fileName) => path.join(__dirname, 'data', fileName);

// ✅ Vendors
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = JSON.parse(fs.readFileSync(getFile('vendors.json')));
    res.json(vendors);
  } catch (err) {
    console.error('Error reading vendors:', err);
    res.status(500).json({ error: 'Failed to read vendors.' });
  }
});

// ✅ Items
app.get('/api/items', (req, res) => {
  try {
    const items = JSON.parse(fs.readFileSync(getFile('items.json')));
    res.json(items);
  } catch (err) {
    console.error('Error reading items:', err);
    res.status(500).json({ error: 'Failed to read items.' });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(getFile('items.json')));
    res.json(products);
  } catch (err) {
    console.error('Error reading products:', err);
    res.status(500).json({ error: 'Failed to read products.' });
  }
});

// ✅ Place order
app.post('/api/orders', (req, res) => {
  try {
    console.log('📩 Incoming order:', req.body);

    const order = req.body || {};
    const coords = order.location || { latitude: 33.881941, longitude: -118.409997 };

    const newOrder = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'placed',
      items: order.items || [],
      total: order.total || 0,
      location: coords
    };

    const ordersPath = getFile('orders.json');
    const currentOrders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath))
      : [];

    currentOrders.push(newOrder);
    fs.writeFileSync(ordersPath, JSON.stringify(currentOrders, null, 2));

    console.log('✅ Order saved:', newOrder);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('❌ Error saving order:', err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// ✅ Get all orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(getFile('orders.json')));
    res.json(orders);
  } catch (err) {
    console.error('Error reading orders:', err);
    res.status(500).json({ error: 'Failed to read orders.' });
  }
});

// ✅ Get latest order
app.get('/api/orders/latest', (req, res) => {
  try {
    const ordersPath = getFile('orders.json');
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath))
      : [];

    const latest = orders.length > 0 ? orders[orders.length - 1] : null;
    res.json(latest);
  } catch (err) {
    console.error('Error fetching latest order:', err);
    res.status(500).json({ error: 'Failed to fetch latest order' });
  }
});

// ✅ Get order by ID
app.get('/api/orders/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    const ordersPath = getFile('orders.json');
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath))
      : [];

    const order = orders.find(o => o.id.toString() === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ✅ Update order status
app.post('/api/orders/status', (req, res) => {
  const { orderId, status } = req.body;

  try {
    const ordersPath = getFile('orders.json');
    const orders = fs.existsSync(ordersPath)
      ? JSON.parse(fs.readFileSync(ordersPath))
      : [];

    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );

    fs.writeFileSync(ordersPath, JSON.stringify(updatedOrders, null, 2));
    res.status(200).json({ message: 'Status updated' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ✅ WebSocket setup
io.on('connection', (socket) => {
  console.log('🚛 Socket connected:', socket.id);

  socket.on('joinOrder', (roomName) => {
    socket.join(roomName);
    console.log(`🧾 Joined room ${roomName}`);
  });

  socket.on('driverLocation', ({ orderId, latitude, longitude }) => {
    console.log('📍 Driver location update:', { orderId, latitude, longitude });

    if (orderId) {
      io.to(`order-${orderId}`).emit('driverLocation', { latitude, longitude });
    }
  });

  socket.on('customerLocation', ({ orderId, latitude, longitude }) => {
    console.log('📌 Customer location update:', { orderId, latitude, longitude });

    if (orderId) {
      io.to(`order-${orderId}`).emit('customerLocation', { latitude, longitude });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running at http://localhost:${PORT}`);
});
