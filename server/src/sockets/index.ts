import { Server as SocketIOServer } from 'socket.io';
import { getPubClient, getSubClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

let io: SocketIOServer | null = null;

export function initSocketIO(socketServer: SocketIOServer) {
  io = socketServer;

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        // Allow anonymous sockets to join public food listing rooms
        socket.data.isAnonymous = true;
        return next();
      }

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      socket.data.user = decoded;
      socket.data.isAnonymous = false;
      return next();
    } catch (err) {
      // Allow fallback as anonymous viewer
      socket.data.isAnonymous = true;
      return next();
    }
  });

  io.on('connection', (socket) => {
    // Join public room for food broadcast
    socket.join('public:food');

    if (!socket.data.isAnonymous && socket.data.user) {
      const { id, role } = socket.data.user;
      // Private room for notifications
      socket.join(`user:${id}`);
      // Role room
      socket.join(`role:${role}`);
      if (role === 'ADMIN') {
        socket.join('admin:stream');
      }
    }

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  // Setup Redis Pub/Sub subscription for multi-instance scaling
  setupPubSubSubscriber();
}

async function setupPubSubSubscriber() {
  try {
    const sub = getSubClient();
    await sub.subscribe(REDIS_KEYS.pubsubChannel(), (message) => {
      if (!io) return;
      try {
        const event = JSON.parse(message);
        const { type, payload, targetRoom } = event;

        if (targetRoom) {
          io.to(targetRoom).emit(type, payload);
        } else {
          // Broadcast to everyone
          io.emit(type, payload);
        }
      } catch (err) {
        console.error('[Socket/PubSub] Failed to parse message:', err);
      }
    });
    console.log('✅ [Socket/PubSub] Subscribed to Redis channel:', REDIS_KEYS.pubsubChannel());
  } catch (err: any) {
    console.error('❌ [Socket/PubSub] Error setting up subscriber:', err.message);
  }
}

/**
 * Publish real-time events via Redis Pub/Sub, which relays to Socket.IO
 */
export async function emitRealtimeEvent(
  type: string,
  payload: any,
  targetRoom?: string
) {
  try {
    const pub = getPubClient();
    const event = {
      type,
      payload,
      targetRoom,
      timestamp: new Date().toISOString(),
    };
    await pub.publish(REDIS_KEYS.pubsubChannel(), JSON.stringify(event));
  } catch (err: any) {
    console.error(`[PubSub] Failed to publish event ${type}:`, err.message);
    // Direct socket fallback if available
    if (io) {
      if (targetRoom) io.to(targetRoom).emit(type, payload);
      else io.emit(type, payload);
    }
  }
}
