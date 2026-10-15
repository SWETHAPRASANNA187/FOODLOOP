import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { initRedis, closeRedis, isRedisReady, getRedisClient } from './redis/client.js';
import { initSocketIO } from './sockets/index.js';
import { startBackgroundWorkers, stopBackgroundWorkers } from './workers/index.js';
import { authRouter } from './routes/auth.routes.js';
import { foodRouter } from './routes/food.routes.js';
import { reservationRouter } from './routes/reservation.routes.js';
import { pickupRouter } from './routes/pickup.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { errorHandler } from './middleware/validate.js';

export const app = express();
export const server = http.createServer(app);

// Socket.IO Server configuration
export const io = new SocketIOServer(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' },
});
app.use('/api/', apiLimiter);

// Health check endpoints
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health/ready', async (req, res) => {
  if (!isRedisReady()) {
    res.status(503).json({
      status: 'NOT_READY',
      redis: 'DISCONNECTED',
      message: 'Redis database is not available. Please verify Redis container is running.',
    });
    return;
  }

  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    res.status(200).json({
      status: 'READY',
      redis: pong === 'PONG' ? 'HEALTHY' : 'UNEXPECTED',
      database: 'Redis (Primary & Only DB)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'ERROR',
      redis: 'UNHEALTHY',
      error: err.message,
    });
  }
});

// Mount Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/food', foodRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/pickups', pickupRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/admin', adminRouter);

// Central error handler
app.use(errorHandler);

// Graceful startup and shutdown
async function startServer() {
  try {
    console.log('🌱 Starting FoodLoop Server...');
    await initRedis();
    initSocketIO(io);
    await startBackgroundWorkers();

    server.listen(config.port, () => {
      console.log(`🚀 FoodLoop Server running on http://localhost:${config.port}`);
      console.log(`🔌 Client URL allowed: ${config.clientUrl}`);
      console.log(`💾 Redis Primary DB connected at: ${config.redisUrl}`);
    });
  } catch (err: any) {
    console.error('❌ Failed to start FoodLoop server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  stopBackgroundWorkers();
  await closeRedis();
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  stopBackgroundWorkers();
  await closeRedis();
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
