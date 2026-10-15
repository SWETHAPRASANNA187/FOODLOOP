import { getRedisClient, getStreamClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { NotificationRepository, ActivityRepository } from '../repositories/notification.repository.js';
import { emitRealtimeEvent } from '../sockets/index.js';

let isRunning = false;
let expiryInterval: NodeJS.Timeout | null = null;

/**
 * Reliable Redis Streams job producer
 */
export async function enqueueJob(taskName: string, payload: Record<string, any>) {
  try {
    const redis = getRedisClient();
    await redis.xAdd(
      REDIS_KEYS.streamJobs(),
      '*',
      {
        taskName,
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString(),
      }
    );
  } catch (err: any) {
    console.error(`[StreamProducer] Failed to enqueue job ${taskName}:`, err.message);
  }
}

/**
 * Initialize Stream Consumer Group
 */
async function initStreamConsumerGroup() {
  const redis = getRedisClient();
  try {
    // Create consumer group if not already existing
    await redis.xGroupCreate(
      REDIS_KEYS.streamJobs(),
      REDIS_KEYS.streamJobsGroup(),
      '0', // Start from beginning of stream
      { MKSTREAM: true }
    );
    console.log('✅ [Worker] Redis Stream consumer group created.');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) {
      console.warn('[Worker] Consumer group warning:', err.message);
    }
  }
}

/**
 * Process single Stream job
 */
async function processStreamJob(messageId: string, taskName: string, payload: any) {
  switch (taskName) {
    case 'NOTIFICATION_DELIVERY': {
      await NotificationRepository.create(payload);
      await emitRealtimeEvent('notification:new', payload, `user:${payload.userId}`);
      break;
    }
    case 'ACTIVITY_AUDIT': {
      await ActivityRepository.record(payload);
      await emitRealtimeEvent('activity:new', payload, 'admin:stream');
      break;
    }
    default:
      console.log(`[Worker] Unhandled task name: ${taskName}`);
  }
}

/**
 * Continuous Stream Consumer loop
 */
async function startStreamConsumerLoop(workerId: string) {
  const streamClient = getStreamClient();
  const consumerName = REDIS_KEYS.streamJobsConsumer(workerId);
  const streamKey = REDIS_KEYS.streamJobs();
  const groupName = REDIS_KEYS.streamJobsGroup();

  while (isRunning) {
    try {
      // Blocking read from Redis Stream with consumer group
      const response = await streamClient.xReadGroup(
        groupName,
        consumerName,
        [{ key: streamKey, id: '>' }],
        { COUNT: 5, BLOCK: 2000 }
      );

      if (response && response.length > 0) {
        for (const streamEntry of response) {
          for (const message of streamEntry.messages) {
            const { id, message: fields } = message;
            const taskName = fields.taskName as string;
            let payload = {};
            try {
              payload = JSON.parse(fields.payload as string);
            } catch {}

            try {
              await processStreamJob(id, taskName, payload);
              // Acknowledge after successful processing
              await streamClient.xAck(streamKey, groupName, id);
            } catch (err: any) {
              console.error(`[Worker] Error processing job ${id}:`, err.message);
              // Dead-letter / bounded retry logic can be added here
            }
          }
        }
      }
    } catch (err: any) {
      if (isRunning) {
        // Sleep briefly on connection drops
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }
}

/**
 * Food Expiry Worker
 * Scans food:expiry sorted set for listings whose expiration time is <= now
 */
export async function runFoodExpiryCheck() {
  try {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const expiredIds = await FoodRepository.getExpiredCandidateIds(nowEpoch);

    for (const foodId of expiredIds) {
      const food = await FoodRepository.findById(foodId);
      if (food && food.status === 'AVAILABLE') {
        console.log(`[ExpiryWorker] Expiring food listing: ${food.title} (${foodId})`);
        await FoodRepository.update(foodId, { status: 'EXPIRED' });

        // Remove from expiry sorted set
        const redis = getRedisClient();
        await redis.zRem(REDIS_KEYS.foodExpiry(), foodId);

        // Notify donor
        await NotificationRepository.create({
          userId: food.donorId,
          title: 'Food Listing Expired',
          message: `Your food listing "${food.title}" has reached its expiration time and is now marked EXPIRED.`,
          type: 'WARNING',
          entityType: 'FOOD',
          entityId: food.id,
        });

        // Real-time broadcast
        await emitRealtimeEvent('food:expired', { foodId: food.id, title: food.title }, 'public:food');
      } else if (food && (food.status === 'COMPLETED' || food.status === 'CANCELLED' || food.status === 'EXPIRED')) {
        // Clean up from sorted set if already completed/cancelled
        const redis = getRedisClient();
        await redis.zRem(REDIS_KEYS.foodExpiry(), foodId);
      }
    }
  } catch (err: any) {
    console.error('[ExpiryWorker] Error during food expiry check:', err.message);
  }
}

export async function startBackgroundWorkers() {
  if (isRunning) return;
  isRunning = true;

  console.log('🚀 [Workers] Starting FoodLoop background workers...');
  await initStreamConsumerGroup();

  // 1. Start Stream Consumer worker
  startStreamConsumerLoop('worker-1').catch((err) => {
    console.error('[WorkerLoop] Crashed:', err);
  });

  // 2. Periodic Food Expiration Worker (every 30 seconds)
  expiryInterval = setInterval(runFoodExpiryCheck, 30000);
  // Initial check
  runFoodExpiryCheck();

  console.log('✅ [Workers] Stream and Expiration background workers active.');
}

export function stopBackgroundWorkers() {
  isRunning = false;
  if (expiryInterval) {
    clearInterval(expiryInterval);
    expiryInterval = null;
  }
  console.log('[Workers] Background workers stopped.');
}
