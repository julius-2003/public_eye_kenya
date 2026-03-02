import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
import { setupSocketHandlers } from './utils/socketHandlers.js';
import { runAIPatternDetector } from './services/aiDetector.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

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
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`🚀 PublicEye server on port ${PORT}`));
});
