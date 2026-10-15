import { getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { ATOMIC_RESERVE_SCRIPT, ATOMIC_CANCEL_RESERVATION_SCRIPT } from '../redis/scripts.js';
import { Reservation, ReservationStatus } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ReservationRepository {
  /**
   * Atomically reserve food inventory using Redis Lua script.
   * Guarantees that inventory is decremented if and only if valid, unexpired, and available.
   * Prevents overselling under high concurrency.
   */
  static async createAtomic(params: {
    foodId: string;
    foodTitle: string;
    recipientId: string;
    recipientName: string;
    donorId: string;
    quantity: number;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; reservation?: Reservation; error?: string; remainingQuantity?: number }> {
    const redis = getRedisClient();
    const resId = `res_${uuidv4()}`;
    const now = new Date();
    const nowEpoch = Math.floor(now.getTime() / 1000);
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

    const reservationData: Reservation = {
      id: resId,
      foodId: params.foodId,
      foodTitle: params.foodTitle,
      recipientId: params.recipientId,
      recipientName: params.recipientName,
      donorId: params.donorId,
      quantity: params.quantity,
      status: 'PENDING',
      pickupCode,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const keys = [
      REDIS_KEYS.food(params.foodId),
      REDIS_KEYS.foodByStatus('AVAILABLE'),
      REDIS_KEYS.foodByStatus('RESERVED'),
      REDIS_KEYS.reservation(resId),
      REDIS_KEYS.reservationsAll(),
      REDIS_KEYS.reservationsByListing(params.foodId),
      REDIS_KEYS.reservationsByRecipient(params.recipientId),
      REDIS_KEYS.reservationsByStatus('PENDING'),
      params.idempotencyKey ? REDIS_KEYS.idempotency(params.idempotencyKey) : 'idempotency:dummy',
    ];

    const args = [
      params.quantity.toString(),
      nowEpoch.toString(),
      JSON.stringify(reservationData),
      resId,
      params.idempotencyKey || '',
      '86400', // 24h idempotency TTL
      params.foodId,
    ];

    try {
      // Execute atomic Lua script
      const result = (await redis.eval(ATOMIC_RESERVE_SCRIPT, {
        keys,
        arguments: args,
      })) as any[];

      const resultCode = Number(result[0]);
      const resultMsg = String(result[1]);

      if (resultCode === 1) {
        // Idempotent duplicate: fetch and return existing reservation
        const existingResId = String(result[2]);
        const existing = await this.findById(existingResId);
        return { success: true, reservation: existing || undefined };
      }

      if (resultCode < 0) {
        return { success: false, error: resultMsg };
      }

      // Success
      const remainingQty = parseFloat(String(result[3]));
      return {
        success: true,
        reservation: reservationData,
        remainingQuantity: remainingQty,
      };
    } catch (err: any) {
      console.error('[ReservationRepository] atomic reservation error:', err);
      return { success: false, error: err.message || 'REDIS_TRANSACTION_FAILED' };
    }
  }

  static async findById(id: string): Promise<Reservation | null> {
    const redis = getRedisClient();
    const raw = await redis.hGet(REDIS_KEYS.reservation(id), 'data');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Reservation;
    } catch {
      return null;
    }
  }

  static async cancelAtomic(
    resId: string,
    actorUserId: string,
    actorRole: string
  ): Promise<{ success: boolean; error?: string; restoredQuantity?: number }> {
    const redis = getRedisClient();
    const existing = await this.findById(resId);
    if (!existing) return { success: false, error: 'RESERVATION_NOT_FOUND' };

    const keys = [
      REDIS_KEYS.reservation(resId),
      REDIS_KEYS.food(existing.foodId),
      REDIS_KEYS.foodByStatus('AVAILABLE'),
      REDIS_KEYS.foodByStatus('RESERVED'),
      REDIS_KEYS.reservationsByStatus('PENDING'),
      REDIS_KEYS.reservationsByStatus('CANCELLED'),
    ];

    const args = [
      resId,
      existing.foodId,
      new Date().toISOString(),
      actorUserId,
      actorRole,
    ];

    try {
      const result = (await redis.eval(ATOMIC_CANCEL_RESERVATION_SCRIPT, {
        keys,
        arguments: args,
      })) as any[];

      const code = Number(result[0]);
      if (code < 0) {
        return { success: false, error: String(result[1]) };
      }
      return { success: true, restoredQuantity: parseFloat(String(result[2])) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async updateStatus(id: string, status: ReservationStatus): Promise<Reservation | null> {
    const redis = getRedisClient();
    const res = await this.findById(id);
    if (!res) return null;

    const oldStatus = res.status;
    res.status = status;
    res.updatedAt = new Date().toISOString();

    const multi = redis.multi();
    multi.hSet(REDIS_KEYS.reservation(id), 'data', JSON.stringify(res));
    multi.sRem(REDIS_KEYS.reservationsByStatus(oldStatus), id);
    multi.sAdd(REDIS_KEYS.reservationsByStatus(status), id);
    await multi.exec();

    return res;
  }

  static async findByRecipient(recipientId: string): Promise<Reservation[]> {
    const redis = getRedisClient();
    const resIds = await redis.sMembers(REDIS_KEYS.reservationsByRecipient(recipientId));
    if (resIds.length === 0) return [];

    const reservations: Reservation[] = [];
    for (const id of resIds) {
      const r = await this.findById(id);
      if (r) reservations.push(r);
    }
    reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reservations;
  }

  static async findByListing(foodId: string): Promise<Reservation[]> {
    const redis = getRedisClient();
    const resIds = await redis.sMembers(REDIS_KEYS.reservationsByListing(foodId));
    if (resIds.length === 0) return [];

    const reservations: Reservation[] = [];
    for (const id of resIds) {
      const r = await this.findById(id);
      if (r) reservations.push(r);
    }
    return reservations;
  }

  static async findAll(): Promise<Reservation[]> {
    const redis = getRedisClient();
    const resIds = await redis.sMembers(REDIS_KEYS.reservationsAll());
    if (resIds.length === 0) return [];

    const reservations: Reservation[] = [];
    for (const id of resIds) {
      const r = await this.findById(id);
      if (r) reservations.push(r);
    }
    reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reservations;
  }

  static async countByStatus(status: ReservationStatus): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.reservationsByStatus(status));
  }

  static async totalCount(): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.reservationsAll());
  }
}
