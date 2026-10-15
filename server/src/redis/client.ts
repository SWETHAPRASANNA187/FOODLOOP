import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

// Dedicated Redis clients:
// 1. mainClient: for normal transactional, key-value, hash, and Lua operations
// 2. pubClient: for publishing real-time events to Redis pub/sub
// 3. subClient: for listening to Redis pub/sub events
// 4. streamClient: for blocking Redis Streams consumer operations

let mainClient: RedisClientType | null = null;
let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;
let streamClient: RedisClientType | null = null;

let isReady = false;

function buildClient(label: string): RedisClientType {
  const client: RedisClientType = createClient({
    url: config.redisUrl,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 20) {
          console.error(`[Redis:${label}] Exceeded maximum connection retries (20). Stopping reconnection.`);
          return new Error('Redis max retries reached');
        }
        const delay = Math.min(retries * 100, 3000);
        console.warn(`[Redis:${label}] Reconnecting in ${delay}ms (attempt #${retries})...`);
        return delay;
      },
      connectTimeout: 5000,
    },
  });

  client.on('error', (err) => {
    // Avoid logging credentials or huge stacks
    console.error(`[Redis:${label}] Error:`, err.message || err);
  });

  client.on('connect', () => {
    console.log(`[Redis:${label}] Socket connected.`);
  });

  client.on('ready', () => {
    console.log(`[Redis:${label}] Client ready for commands.`);
  });

  client.on('reconnecting', () => {
    console.log(`[Redis:${label}] Reconnecting...`);
  });

  client.on('end', () => {
    console.log(`[Redis:${label}] Connection closed.`);
  });

  return client;
}

export async function initRedis(): Promise<{
  main: RedisClientType;
  pub: RedisClientType;
  sub: RedisClientType;
  stream: RedisClientType;
}> {
  if (mainClient && isReady) {
    return { main: mainClient, pub: pubClient!, sub: subClient!, stream: streamClient! };
  }

  console.log(`[Redis] Connecting to ${config.redisUrl.replace(/:\/\/.*@/, '://***@')}...`);

  mainClient = buildClient('Main');
  pubClient = buildClient('Pub');
  subClient = buildClient('Sub');
  streamClient = buildClient('Stream');

  try {
    await Promise.all([
      mainClient.connect(),
      pubClient.connect(),
      subClient.connect(),
      streamClient.connect(),
    ]);

    // Mandatory PING verification: never report connected until PING responds PONG!
    const pong = await mainClient.ping();
    if (pong !== 'PONG') {
      throw new Error(`Redis PING response invalid: received ${pong}`);
    }

    isReady = true;
    console.log('✅ [Redis] All clients connected and PING verified successfully.');

    return { main: mainClient, pub: pubClient, sub: subClient, stream: streamClient };
  } catch (err: any) {
    isReady = false;
    console.error('❌ [Redis] Failed to initialize connection to Redis:');
    console.error('   Hint: Make sure Redis is running! Run "docker compose up -d redis" or start local Redis service.');
    console.error('   Error detail:', err.message);
    throw err;
  }
}

export function getRedisClient(): RedisClientType {
  if (!mainClient || !isReady) {
    throw new Error('Redis main client is not initialized or not ready. Call initRedis() first.');
  }
  return mainClient;
}

export function getPubClient(): RedisClientType {
  if (!pubClient) throw new Error('Redis pub client not initialized');
  return pubClient;
}

export function getSubClient(): RedisClientType {
  if (!subClient) throw new Error('Redis sub client not initialized');
  return subClient;
}

export function getStreamClient(): RedisClientType {
  if (!streamClient) throw new Error('Redis stream client not initialized');
  return streamClient;
}

export function isRedisReady(): boolean {
  return isReady;
}

export async function closeRedis(): Promise<void> {
  console.log('[Redis] Closing connections gracefully...');
  isReady = false;
  const clients = [mainClient, pubClient, subClient, streamClient];
  await Promise.all(
    clients.map(async (client) => {
      if (client && client.isOpen) {
        try {
          await client.quit();
        } catch (e) {
          // ignore error on quit
        }
      }
    })
  );
  console.log('[Redis] All connections closed.');
}
