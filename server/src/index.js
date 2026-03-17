import dotenv from 'dotenv';
dotenv.config(); // ✅ MUST be first before any other imports that use env vars

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';


import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import scoreboardRoutes from './routes/scoreboard.js';
import taskforceRoutes from './routes/taskforce.js';
import evidenceRoutes from './routes/evidence.js';
import supportRoutes from './routes/support.js';
import emailRoutes from './routes/email.js';
import heatmapRoutes from './routes/heatmap.js';
import notificationRoutes from './routes/notification.js';
import announcementRoutes from './routes/announcement.js';
import uploadsRoutes from './routes/uploads.js';
import { setupSocketHandlers } from './utils/socketHandlers.js';
import { runAIPatternDetector } from './services/aiDetector.js';

// Development CORS - allow localhost on any port
const corsOrigin = (origin, callback) => {
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || process.env.NODE_ENV === 'production') {
    callback(null, true);
  } else {
    callback(null, process.env.CLIENT_URL || 'http://localhost:5173');
  }
};

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ 
  origin: corsOrigin, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Explicit CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static files separately with explicit CORS
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// API route for serving uploads with proper CORS
app.use('/api/uploads', uploadsRoutes);

// Attach io to req
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/taskforce', taskforceRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);

// Root endpoint - Health check
app.get('/', (_req, res) => {
  res.json({ 
    message: 'PublicEye API running...', 
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

setupSocketHandlers(io);

// AI cron: every 30 min
cron.schedule('*/30 * * * *', runAIPatternDetector);

connectDB().then(() => {
  let PORT = parseInt(process.env.PORT, 10) || 5000;
  
  const startServer = (port) => {
    httpServer.listen(port, () => {
      console.log(`🚀 PublicEye server on port ${port}`);
    });

    httpServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
        httpServer.close();
        startServer(port + 1);
      } else {
        throw err;
      }
    });
  };

  startServer(PORT);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
