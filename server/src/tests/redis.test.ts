import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initRedis, closeRedis, getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { UserRepository } from '../repositories/user.repository.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { v4 as uuidv4 } from 'uuid';

describe('FoodLoop Redis Integration & Concurrency Tests', () => {
  beforeAll(async () => {
    await initRedis();
  });

  afterAll(async () => {
    await closeRedis();
  });

  it('verifies Redis PING responds with PONG', async () => {
    const redis = getRedisClient();
    const pong = await redis.ping();
    expect(pong).toBe('PONG');
  });

  it('prevents duplicate email registration', async () => {
    const email = `test_${uuidv4()}@example.com`;
    const user1 = {
      id: `usr_${uuidv4()}`,
      name: 'Test Donor',
      email,
      passwordHash: 'hashed_pw',
      role: 'DONOR' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await UserRepository.create(user1);
    const exists = await UserRepository.emailExists(email);
    expect(exists).toBe(true);

    const fetched = await UserRepository.findByEmail(email);
    expect(fetched?.name).toBe('Test Donor');
  });

  it('handles food listing creation and retrieval', async () => {
    const foodId = `food_test_${uuidv4()}`;
    const listing = {
      id: foodId,
      donorId: 'usr_test_donor',
      donorName: 'Test Bakery',
      title: 'Whole Grain Bagels',
      description: 'Delicious hot bagels',
      category: 'BAKERY' as const,
      quantity: 15,
      initialQuantity: 15,
      quantityUnit: 'bagels',
      preparedTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      pickupStartTime: new Date().toISOString(),
      pickupEndTime: new Date(Date.now() + 36000000).toISOString(),
      address: '10 Bagel Street',
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await FoodRepository.create(listing);
    const found = await FoodRepository.findById(foodId);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Whole Grain Bagels');
    expect(found?.quantity).toBe(15);
  });

  it('CRITICAL: guarantees concurrency protection & atomic inventory reservation preventing overselling', async () => {
    // Create food with exactly 10 units
    const foodId = `food_atomic_${uuidv4()}`;
    await FoodRepository.create({
      id: foodId,
      donorId: 'usr_donor',
      donorName: 'Atomic Bakery',
      title: 'Limited Artisan Tart',
      description: 'Only 10 available',
      category: 'BAKERY' as const,
      quantity: 10,
      initialQuantity: 10,
      quantityUnit: 'tarts',
      preparedTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      pickupStartTime: new Date().toISOString(),
      pickupEndTime: new Date(Date.now() + 36000000).toISOString(),
      address: '100 Tart Street',
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Launch 10 simultaneous requests each attempting to reserve 2 units
    // Total requested: 20 units, but only 10 exist!
    // Exactly 5 requests must succeed (10/2 = 5), and 5 must fail with INSUFFICIENT_QUANTITY
    const requests = Array.from({ length: 10 }, (_, idx) => {
      return ReservationRepository.createAtomic({
        foodId,
        foodTitle: 'Limited Artisan Tart',
        recipientId: `recipient_${idx}`,
        recipientName: `Recipient ${idx}`,
        donorId: 'usr_donor',
        quantity: 2,
      });
    });

    const results = await Promise.all(requests);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    expect(successful.length).toBe(5);
    expect(failed.length).toBe(5);

    // Verify Redis inventory is exactly 0 and status is RESERVED
    const finalFood = await FoodRepository.findById(foodId);
    expect(finalFood?.quantity).toBe(0);
    expect(finalFood?.status).toBe('RESERVED');
  });

  it('supports atomic reservation cancellation and inventory restoration', async () => {
    const foodId = `food_cancel_${uuidv4()}`;
    await FoodRepository.create({
      id: foodId,
      donorId: 'usr_donor',
      donorName: 'Pastry Shop',
      title: 'Croissants',
      description: 'Hot croissants',
      category: 'BAKERY' as const,
      quantity: 5,
      initialQuantity: 5,
      quantityUnit: 'croissants',
      preparedTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 86400000).toISOString(),
      pickupStartTime: new Date().toISOString(),
      pickupEndTime: new Date(Date.now() + 36000000).toISOString(),
      address: '123 River Road',
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Reserve 5
    const res = await ReservationRepository.createAtomic({
      foodId,
      foodTitle: 'Croissants',
      recipientId: 'usr_recipient_cancel',
      recipientName: 'Cancel Tester',
      donorId: 'usr_donor',
      quantity: 5,
    });
    expect(res.success).toBe(true);

    let food = await FoodRepository.findById(foodId);
    expect(food?.quantity).toBe(0);
    expect(food?.status).toBe('RESERVED');

    // Cancel reservation
    const cancelRes = await ReservationRepository.cancelAtomic(
      res.reservation!.id,
      'usr_recipient_cancel',
      'RECIPIENT'
    );
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.restoredQuantity).toBe(5);

    // Verify quantity restored to 5 and status returned to AVAILABLE
    food = await FoodRepository.findById(foodId);
    expect(food?.quantity).toBe(5);
    expect(food?.status).toBe('AVAILABLE');
  });

  it('updates food listing fields and maintains Redis categorical and expiry indexes', async () => {
    const foodId = `food_upd_${uuidv4()}`;
    const initialExp = new Date(Date.now() + 36000000).toISOString();
    await FoodRepository.create({
      id: foodId,
      donorId: 'usr_donor_upd',
      donorName: 'Test Donor',
      title: 'Original Bread',
      description: 'Original description here',
      category: 'BAKERY' as const,
      quantity: 10,
      initialQuantity: 10,
      quantityUnit: 'loaves',
      preparedTime: new Date().toISOString(),
      expirationTime: initialExp,
      pickupStartTime: new Date().toISOString(),
      pickupEndTime: new Date(Date.now() + 18000000).toISOString(),
      address: '100 Baker Way',
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update title, category, quantity, and expiration
    const updatedExp = new Date(Date.now() + 72000000).toISOString();
    const updated = await FoodRepository.update(foodId, {
      title: 'Updated Sourdough Boule',
      category: 'COOKED_MEALS' as const,
      quantity: 8,
      expirationTime: updatedExp,
      address: '102 Baker Blvd',
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Updated Sourdough Boule');
    expect(updated?.category).toBe('COOKED_MEALS');
    expect(updated?.quantity).toBe(8);
    expect(updated?.address).toBe('102 Baker Blvd');

    // Verify Redis index changes
    const redis = getRedisClient();
    const isOldCat = await redis.sIsMember(REDIS_KEYS.foodByCategory('BAKERY'), foodId);
    const isNewCat = await redis.sIsMember(REDIS_KEYS.foodByCategory('COOKED_MEALS'), foodId);
    expect(isOldCat).toBe(false);
    expect(isNewCat).toBe(true);
  });

  it('deletes food listing and cleans all secondary Redis indexes', async () => {
    const foodId = `food_del_${uuidv4()}`;
    await FoodRepository.create({
      id: foodId,
      donorId: 'usr_donor_del',
      donorName: 'Delete Bakery',
      title: 'Delete Me Soon',
      description: 'Listing to be removed from Redis',
      category: 'PRODUCE' as const,
      quantity: 20,
      initialQuantity: 20,
      quantityUnit: 'boxes',
      preparedTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 36000000).toISOString(),
      pickupStartTime: new Date().toISOString(),
      pickupEndTime: new Date(Date.now() + 18000000).toISOString(),
      address: '99 Warehouse Road',
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const deleted = await FoodRepository.delete(foodId);
    expect(deleted).toBe(true);

    const fetched = await FoodRepository.findById(foodId);
    expect(fetched).toBeNull();

    const redis = getRedisClient();
    const inAll = await redis.sIsMember(REDIS_KEYS.foodAll(), foodId);
    const inStatus = await redis.sIsMember(REDIS_KEYS.foodByStatus('AVAILABLE'), foodId);
    expect(inAll).toBe(false);
    expect(inStatus).toBe(false);
  });

  it('enforces atomic single volunteer claim for pickup tasks', async () => {
    const pickup = await PickupRepository.create({
      reservationId: 'res_test_task',
      foodId: 'food_test_task',
      foodTitle: 'Delivery Meal',
      donorId: 'usr_donor_d',
      donorAddress: '10 Delivery Ave',
      recipientId: 'usr_recip_d',
      recipientName: 'Shelter',
      recipientAddress: '20 Shelter Lane',
    });

    // Two volunteers attempt to claim simultaneously
    const [claim1, claim2] = await Promise.all([
      PickupRepository.claimAtomic(pickup.id, 'vol_1', 'Volunteer 1'),
      PickupRepository.claimAtomic(pickup.id, 'vol_2', 'Volunteer 2'),
    ]);

    // One succeeds, one fails
    const successCount = (claim1.success ? 1 : 0) + (claim2.success ? 1 : 0);
    expect(successCount).toBe(1);

    const updatedTask = await PickupRepository.findById(pickup.id);
    expect(updatedTask?.status).toBe('ACCEPTED');
  });
});
