/* eslint-disable no-console */
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Use Render's port if available
const PORT = process.env.PORT || 5000;

/* ------------------------------------------------------------------ */
/*  CORS Configuration                                                 */
/* ------------------------------------------------------------------ */
const ALLOWED_ORIGINS = [
  'https://shorethingsapp-1.onrender.com', // Frontend
  'http://localhost:3000'                  // Local dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked: ${origin}`);
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json()); // replaces bodyParser.json()
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------------------------------------------------------ */
/*  Ping Route for Debugging                                           */
/* ------------------------------------------------------------------ */
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const getFile = (fileName) => path.join(DATA_DIR, fileName);

function ensureFile(fileName, initial = '[]') {
  const p = getFile(fileName);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, initial);
  }
}
ensureFile('orders.json', '[]');
ensureFile('items.json', '[]');
ensureFile('vendors.json', '[]');

function safeReadJSON(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const txt = fs.readFileSync(filePath, 'utf8');
    if (!txt.trim()) return fallback;
    return JSON.parse(txt);
  } catch (e) {
    console.error(`[safeReadJSON] Failed reading ${filePath}:`, e);
    return fallback;
  }
}

function safeWriteJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`[safeWriteJSON] Failed writing ${filePath}:`, e);
  }
}

// Make sure every order has a consistent { latitude, longitude } object
function normalizeLocation(location) {
  if (!location) return { latitude: 33.881941, longitude: -118.409997 };
  if (Array.isArray(location) && location.length >= 2) {
    return { latitude: Number(location[1]), longitude: Number(location[0]) };
  }
  const latitude = location.latitude ?? location.lat;
  const longitude = location.longitude ?? location.lon;
  if (latitude != null && longitude != null) {
    return { latitude: Number(latitude), longitude: Number(longitude) };
  }
  return { latitude: 33.881941, longitude: -118.409997 };
}

/* ------------------------------------------------------------------ */
/*  Routes: Vendors / Items / Products                                 */
/* ------------------------------------------------------------------ */

// ✅ Vendors
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = safeReadJSON(getFile('vendors.json'), []);
    res.json(vendors);
  } catch (err) {
    console.error('Error reading vendors:', err);
    res.status(500).json({ error: 'Failed to read vendors.' });
  }
});

// ✅ Items
app.get('/api/items', (req, res) => {
  try {
    const items = safeReadJSON(getFile('items.json'), []);
    res.json(items);
  } catch (err) {
    console.error('Error reading items:', err);
    res.status(500).json({ error: 'Failed to read items.' });
  }
});

// Alias
app.get('/api/products', (req, res) => {
  try {
    const products = safeReadJSON(getFile('items.json'), []);
    res.json(products);
  } catch (err) {
    console.error('Error reading products:', err);
    res.status(500).json({ error: 'Failed to read products.' });
  }
});

/* ------------------------------------------------------------------ */
/*  Routes: Orders                                                     */
/* ------------------------------------------------------------------ */

// ✅ Place order
app.post('/api/orders', (req, res) => {
  try {
    console.log('📩 Incoming order:', req.body);

    const order = req.body || {};
    const location = normalizeLocation(order.location);

    const newOrder = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'placed',
      items: order.items || [],
      total: order.total || 0,
      location
    };

    const ordersPath = getFile('orders.json');
    const currentOrders = safeReadJSON(ordersPath, []);
    currentOrders.push(newOrder);
    safeWriteJSON(ordersPath, currentOrders);

    console.log('✅ Order saved:', newOrder);
    io.emit('ordersUpdated', newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('❌ Error saving order:', err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// ✅ Get all orders (normalized)
app.get('/api/orders', (req, res) => {
  try {
    const ordersPath = getFile('orders.json');
    const orders = safeReadJSON(ordersPath, []).map(o => ({
      ...o,
      location: normalizeLocation(o.location)
    }));
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
    const orders = safeReadJSON(ordersPath, []);
    const latest = orders.length > 0 ? orders[orders.length - 1] : null;
    res.json(latest ? { ...latest, location: normalizeLocation(latest.location) } : null);
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
    const orders = safeReadJSON(ordersPath, []);
    const order = orders.find(o => (o.id + '') === (orderId + ''));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ ...order, location: normalizeLocation(order.location) });
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
    const orders = safeReadJSON(ordersPath, []);

    let updated = null;
    const updatedOrders = orders.map(order => {
      if ((order.id + '') === (orderId + '')) {
        updated = { ...order, status };
        return updated;
      }
      return order;
    });

    safeWriteJSON(ordersPath, updatedOrders);

    if (updated) {
      io.to(`order-${orderId}`).emit('orderStatusUpdated', { orderId, status });
    }

    res.status(200).json({ message: 'Status updated' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/* ------------------------------------------------------------------ */
/*  WebSocket (Socket.IO)                                              */
/* ------------------------------------------------------------------ */

io.on('connection', (socket) => {
  console.log('🚛 Socket connected:', socket.id);

  socket.on('joinOrder', (orderId) => {
    const room = `order-${orderId}`;
    socket.join(room);
    console.log(`🧾 ${socket.id} joined room ${room}`);
  });

  socket.on('driverLocation', ({ orderId, latitude, longitude }) => {
    const room = `order-${orderId}`;
    console.log('📍 Driver location update:', { orderId, latitude, longitude });
    if (orderId) {
      io.to(room).emit('driverLocation', { latitude, longitude });
    }
  });

  socket.on('customerLocation', ({ orderId, latitude, longitude }) => {
    const room = `order-${orderId}`;
    console.log('📌 Customer location update:', { orderId, latitude, longitude });
    if (orderId) {
      io.to(room).emit('customerLocation', { latitude, longitude });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

/* ------------------------------------------------------------------ */

server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
});
