import { getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { ATOMIC_CLAIM_PICKUP_SCRIPT } from '../redis/scripts.js';
import { PickupTask, PickupStatus } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class PickupRepository {
  static async create(data: Omit<PickupTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PickupTask> {
    const redis = getRedisClient();
    const id = `pk_${uuidv4()}`;
    const now = new Date().toISOString();

    const pickup: PickupTask = {
      ...data,
      id,
      status: 'AVAILABLE',
      createdAt: now,
      updatedAt: now,
    };

    const multi = redis.multi();
    multi.hSet(REDIS_KEYS.pickup(id), 'data', JSON.stringify(pickup));
    multi.sAdd(REDIS_KEYS.pickupsAll(), id);
    multi.sAdd(REDIS_KEYS.pickupsAvailable(), id);
    multi.sAdd(REDIS_KEYS.pickupsByStatus('AVAILABLE'), id);
    await multi.exec();

    return pickup;
  }

  static async findById(id: string): Promise<PickupTask | null> {
    const redis = getRedisClient();
    const raw = await redis.hGet(REDIS_KEYS.pickup(id), 'data');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PickupTask;
    } catch {
      return null;
    }
  }

  static async claimAtomic(
    pickupId: string,
    volunteerId: string,
    volunteerName: string
  ): Promise<{ success: boolean; pickup?: PickupTask; error?: string }> {
    const redis = getRedisClient();
    const keys = [
      REDIS_KEYS.pickup(pickupId),
      REDIS_KEYS.pickupsAvailable(),
      REDIS_KEYS.pickupsByVolunteer(volunteerId),
      REDIS_KEYS.pickupsByStatus('AVAILABLE'),
      REDIS_KEYS.pickupsByStatus('ACCEPTED'),
    ];

    const args = [
      pickupId,
      volunteerId,
      volunteerName,
      new Date().toISOString(),
    ];

    try {
      const result = (await redis.eval(ATOMIC_CLAIM_PICKUP_SCRIPT, {
        keys,
        arguments: args,
      })) as any[];

      const code = Number(result[0]);
      if (code < 0) {
        return { success: false, error: String(result[1]) };
      }

      const updated = JSON.parse(String(result[2])) as PickupTask;
      return { success: true, pickup: updated };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async updateStatus(
    pickupId: string,
    newStatus: PickupStatus,
    volunteerId: string
  ): Promise<{ success: boolean; pickup?: PickupTask; error?: string }> {
    const redis = getRedisClient();
    const task = await this.findById(pickupId);
    if (!task) return { success: false, error: 'PICKUP_NOT_FOUND' };

    // Volunteer check
    if (task.volunteerId !== volunteerId) {
      return { success: false, error: 'UNAUTHORIZED_NOT_ASSIGNED_VOLUNTEER' };
    }

    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    if (newStatus === 'DELIVERED') {
      task.deliveredAt = new Date().toISOString();
    }

    const multi = redis.multi();
    multi.hSet(REDIS_KEYS.pickup(pickupId), 'data', JSON.stringify(task));
    multi.sRem(REDIS_KEYS.pickupsByStatus(oldStatus), pickupId);
    multi.sAdd(REDIS_KEYS.pickupsByStatus(newStatus), pickupId);
    if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
      multi.sRem(REDIS_KEYS.pickupsAvailable(), pickupId);
      if (newStatus === 'DELIVERED') {
        multi.incr(REDIS_KEYS.metricsPickupsCompleted());
      }
    }
    await multi.exec();

    return { success: true, pickup: task };
  }

  static async findAvailable(): Promise<PickupTask[]> {
    const redis = getRedisClient();
    const ids = await redis.sMembers(REDIS_KEYS.pickupsAvailable());
    if (ids.length === 0) return [];

    const tasks: PickupTask[] = [];
    for (const id of ids) {
      const t = await this.findById(id);
      if (t) tasks.push(t);
    }
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tasks;
  }

  static async findByVolunteer(volunteerId: string): Promise<PickupTask[]> {
    const redis = getRedisClient();
    const ids = await redis.sMembers(REDIS_KEYS.pickupsByVolunteer(volunteerId));
    if (ids.length === 0) return [];

    const tasks: PickupTask[] = [];
    for (const id of ids) {
      const t = await this.findById(id);
      if (t) tasks.push(t);
    }
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tasks;
  }

  static async findAll(): Promise<PickupTask[]> {
    const redis = getRedisClient();
    const ids = await redis.sMembers(REDIS_KEYS.pickupsAll());
    if (ids.length === 0) return [];

    const tasks: PickupTask[] = [];
    for (const id of ids) {
      const t = await this.findById(id);
      if (t) tasks.push(t);
    }
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tasks;
  }

  static async countCompleted(): Promise<number> {
    const redis = getRedisClient();
    const count = await redis.get(REDIS_KEYS.metricsPickupsCompleted());
    return count ? parseInt(count, 10) : 0;
  }

  static async cancelByVolunteer(pickupId: string, volunteerId: string): Promise<{ success: boolean; pickup?: PickupTask; error?: string }> {
    const redis = getRedisClient();
    const task = await this.findById(pickupId);
    if (!task) return { success: false, error: 'PICKUP_NOT_FOUND' };

    if (task.volunteerId !== volunteerId) {
      return { success: false, error: 'UNAUTHORIZED_NOT_ASSIGNED_VOLUNTEER' };
    }

    if (task.status === 'DELIVERED') {
      return { success: false, error: 'CANNOT_CANCEL_DELIVERED_TASK' };
    }

    const oldStatus = task.status;
    task.status = 'AVAILABLE';
    task.volunteerId = undefined;
    task.volunteerName = undefined;
    task.acceptedAt = undefined;
    task.updatedAt = new Date().toISOString();

    const multi = redis.multi();
    multi.hSet(REDIS_KEYS.pickup(pickupId), 'data', JSON.stringify(task));
    multi.sRem(REDIS_KEYS.pickupsByStatus(oldStatus), pickupId);
    multi.sAdd(REDIS_KEYS.pickupsByStatus('AVAILABLE'), pickupId);
    multi.sRem(REDIS_KEYS.pickupsByVolunteer(volunteerId), pickupId);
    multi.sAdd(REDIS_KEYS.pickupsAvailable(), pickupId);
    await multi.exec();

    return { success: true, pickup: task };
  }

  static async delete(pickupId: string): Promise<boolean> {
    const redis = getRedisClient();
    const task = await this.findById(pickupId);
    if (!task) return false;

    const multi = redis.multi();
    multi.del(REDIS_KEYS.pickup(pickupId));
    multi.sRem(REDIS_KEYS.pickupsAll(), pickupId);
    multi.sRem(REDIS_KEYS.pickupsAvailable(), pickupId);
    multi.sRem(REDIS_KEYS.pickupsByStatus(task.status), pickupId);
    if (task.volunteerId) {
      multi.sRem(REDIS_KEYS.pickupsByVolunteer(task.volunteerId), pickupId);
    }
    await multi.exec();
    return true;
  }
}
