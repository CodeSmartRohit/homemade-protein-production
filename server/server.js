require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Database connection
const connectDB = require('./config/db');

// Socket handler
const initializeSocket = require('./socket/index');

// Route imports
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const requestRoutes = require('./routes/requests');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

// Seed utility
const seedDatabase = require('./utils/seed');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins until Vercel frontend is deployed
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Initialize socket handlers
initializeSocket(io);

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (server-to-server, health checks, cURL)
    if (!origin) return callback(null, true);
    
    // In development, allow everything
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    
    // In production, allow known domains
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.railway.app') ||
        origin.endsWith('.loca.lt')) {
      return callback(null, true);
    }
    
    // Temporarily allow all origins until Vercel frontend is deployed
    // TODO: Remove this once CLIENT_URL is set to the Vercel URL
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 1000, // 1000 in prod
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 100 in prod
  message: { success: false, message: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🍽️ HOMEMADE Protein API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use(errorHandler);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

// Start listening immediately to avoid health check timeouts on Railway
server.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'production';
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🍽️  HOMEMADE Protein API Server            ║');
  console.log(`║   🚀 Running on port ${String(PORT).padEnd(24)} ║`);
  console.log(`║   📡 Environment: ${env.padEnd(20)}  ║`);
  console.log('║   🔌 Socket.io: Active                       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Now handle background initialization
  (async () => {
    try {
      // Initialize Local DB / MongoDB
      await connectDB();

      // Seed database with initial data
      await seedDatabase();
      
      console.log('✅ Background initialization complete');
    } catch (error) {
      console.error('⚠️ Background initialization failed:', error.message);
    }
  })();
});

module.exports = { app, server, io };
