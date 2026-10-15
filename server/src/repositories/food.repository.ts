import { getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { FoodListing, FoodStatus, FoodCategory } from '../types/index.js';

export interface FoodFilterOptions {
  category?: FoodCategory;
  status?: FoodStatus;
  donorId?: string;
  search?: string;
  sortBy?: 'expiry' | 'newest';
  page?: number;
  limit?: number;
}

export class FoodRepository {
  static async create(listing: FoodListing): Promise<FoodListing> {
    const redis = getRedisClient();
    const foodKey = REDIS_KEYS.food(listing.id);
    const expEpoch = Math.floor(new Date(listing.expirationTime).getTime() / 1000);

    const multi = redis.multi();
    // Store complete listing as Hash
    multi.hSet(foodKey, {
      id: listing.id,
      donorId: listing.donorId,
      donorName: listing.donorName,
      donorOrg: listing.donorOrg || '',
      title: listing.title,
      description: listing.description,
      category: listing.category,
      quantity: listing.quantity.toString(),
      initialQuantity: listing.initialQuantity.toString(),
      quantityUnit: listing.quantityUnit,
      preparedTime: listing.preparedTime,
      expirationTime: listing.expirationTime,
      expirationTimeEpoch: expEpoch.toString(),
      pickupStartTime: listing.pickupStartTime,
      pickupEndTime: listing.pickupEndTime,
      address: listing.address,
      latitude: listing.latitude ? listing.latitude.toString() : '',
      longitude: listing.longitude ? listing.longitude.toString() : '',
      imageUrl: listing.imageUrl || '',
      allergenInfo: listing.allergenInfo || '',
      storageInstructions: listing.storageInstructions || '',
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    });

    // Maintained indexes
    multi.sAdd(REDIS_KEYS.foodAll(), listing.id);
    multi.sAdd(REDIS_KEYS.foodByStatus(listing.status), listing.id);
    multi.sAdd(REDIS_KEYS.foodByDonor(listing.donorId), listing.id);
    multi.sAdd(REDIS_KEYS.foodByCategory(listing.category), listing.id);
    multi.zAdd(REDIS_KEYS.foodExpiry(), { score: expEpoch, value: listing.id });

    // Geospatial indexing if coordinates available
    if (listing.longitude !== undefined && listing.latitude !== undefined) {
      multi.geoAdd(REDIS_KEYS.foodGeo(), {
        longitude: listing.longitude,
        latitude: listing.latitude,
        member: listing.id,
      });
    }

    await multi.exec();
    return listing;
  }

  static async findById(id: string): Promise<FoodListing | null> {
    const redis = getRedisClient();
    const data = await redis.hGetAll(REDIS_KEYS.food(id));
    if (!data || Object.keys(data).length === 0 || !data.id) return null;

    return {
      id: data.id,
      donorId: data.donorId,
      donorName: data.donorName,
      donorOrg: data.donorOrg || undefined,
      title: data.title,
      description: data.description,
      category: data.category as FoodCategory,
      quantity: parseFloat(data.quantity || '0'),
      initialQuantity: parseFloat(data.initialQuantity || data.quantity || '0'),
      quantityUnit: data.quantityUnit,
      preparedTime: data.preparedTime,
      expirationTime: data.expirationTime,
      pickupStartTime: data.pickupStartTime,
      pickupEndTime: data.pickupEndTime,
      address: data.address,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      imageUrl: data.imageUrl || undefined,
      allergenInfo: data.allergenInfo || undefined,
      storageInstructions: data.storageInstructions || undefined,
      status: data.status as FoodStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static async update(id: string, updates: Partial<FoodListing>): Promise<FoodListing | null> {
    const redis = getRedisClient();
    const existing = await this.findById(id);
    if (!existing) return null;

    const foodKey = REDIS_KEYS.food(id);
    const hashUpdates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.title) hashUpdates.title = updates.title;
    if (updates.description) hashUpdates.description = updates.description;
    if (updates.quantity !== undefined) hashUpdates.quantity = updates.quantity.toString();
    if (updates.quantityUnit) hashUpdates.quantityUnit = updates.quantityUnit;
    if (updates.address) hashUpdates.address = updates.address;
    if (updates.imageUrl !== undefined) hashUpdates.imageUrl = updates.imageUrl;
    if (updates.allergenInfo !== undefined) hashUpdates.allergenInfo = updates.allergenInfo;
    if (updates.storageInstructions !== undefined) hashUpdates.storageInstructions = updates.storageInstructions;
    if (updates.preparedTime) hashUpdates.preparedTime = updates.preparedTime;
    if (updates.pickupStartTime) hashUpdates.pickupStartTime = updates.pickupStartTime;
    if (updates.pickupEndTime) hashUpdates.pickupEndTime = updates.pickupEndTime;

    const multi = redis.multi();

    // Category update and index maintenance
    if (updates.category && updates.category !== existing.category) {
      hashUpdates.category = updates.category;
      multi.sRem(REDIS_KEYS.foodByCategory(existing.category), id);
      multi.sAdd(REDIS_KEYS.foodByCategory(updates.category), id);
    }

    // Expiry update and sorted set maintenance
    if (updates.expirationTime) {
      hashUpdates.expirationTime = updates.expirationTime;
      const newEpoch = Math.floor(new Date(updates.expirationTime).getTime() / 1000);
      hashUpdates.expirationTimeEpoch = newEpoch.toString();
      multi.zAdd(REDIS_KEYS.foodExpiry(), { score: newEpoch, value: id });
    }

    // Status transition and index maintenance
    if (updates.status && updates.status !== existing.status) {
      hashUpdates.status = updates.status;
      multi.sRem(REDIS_KEYS.foodByStatus(existing.status), id);
      multi.sAdd(REDIS_KEYS.foodByStatus(updates.status), id);
    }

    multi.hSet(foodKey, hashUpdates);
    await multi.exec();

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const redis = getRedisClient();
    const existing = await this.findById(id);
    if (!existing) return false;

    const multi = redis.multi();
    multi.del(REDIS_KEYS.food(id));
    multi.sRem(REDIS_KEYS.foodAll(), id);
    multi.sRem(REDIS_KEYS.foodByStatus(existing.status), id);
    multi.sRem(REDIS_KEYS.foodByDonor(existing.donorId), id);
    multi.sRem(REDIS_KEYS.foodByCategory(existing.category), id);
    multi.zRem(REDIS_KEYS.foodExpiry(), id);
    multi.zRem(REDIS_KEYS.foodGeo(), id);
    await multi.exec();
    return true;
  }

  static async query(options: FoodFilterOptions): Promise<{ items: FoodListing[]; total: number }> {
    const redis = getRedisClient();
    let candidateIds: string[] = [];

    // Use specific set index to avoid keyspace scans
    if (options.status) {
      candidateIds = await redis.sMembers(REDIS_KEYS.foodByStatus(options.status));
    } else if (options.donorId) {
      candidateIds = await redis.sMembers(REDIS_KEYS.foodByDonor(options.donorId));
    } else if (options.category) {
      candidateIds = await redis.sMembers(REDIS_KEYS.foodByCategory(options.category));
    } else {
      candidateIds = await redis.sMembers(REDIS_KEYS.foodAll());
    }

    if (candidateIds.length === 0) {
      return { items: [], total: 0 };
    }

    // Retrieve listings in parallel batch
    const listings: FoodListing[] = [];
    for (const id of candidateIds) {
      const item = await this.findById(id);
      if (item) {
        // Apply filter checks
        if (options.status && item.status !== options.status) continue;
        if (options.category && item.category !== options.category) continue;
        if (options.donorId && item.donorId !== options.donorId) continue;
        if (options.search) {
          const s = options.search.toLowerCase();
          const match = item.title.toLowerCase().includes(s) ||
            item.description.toLowerCase().includes(s) ||
            item.address.toLowerCase().includes(s) ||
            item.donorName.toLowerCase().includes(s);
          if (!match) continue;
        }
        listings.push(item);
      }
    }

    // Sort listings
    if (options.sortBy === 'expiry') {
      listings.sort((a, b) => new Date(a.expirationTime).getTime() - new Date(b.expirationTime).getTime());
    } else {
      // Default: newest first
      listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = listings.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const start = (page - 1) * limit;
    const paginatedItems = listings.slice(start, start + limit);

    return { items: paginatedItems, total };
  }

  static async findNearby(latitude: number, longitude: number, radiusKm: number = 20): Promise<FoodListing[]> {
    const redis = getRedisClient();
    try {
      const results = await redis.geoSearch(
        REDIS_KEYS.foodGeo(),
        { latitude, longitude },
        { radius: radiusKm, unit: 'km' }
      );
      if (!results || results.length === 0) return [];

      const listings: FoodListing[] = [];
      for (const id of results) {
        const item = await this.findById(id);
        if (item && item.status === 'AVAILABLE') {
          listings.push(item);
        }
      }
      return listings;
    } catch (e) {
      console.warn('[FoodRepository] GeoSearch fallback, searching available food:', e);
      const res = await this.query({ status: 'AVAILABLE', limit: 20 });
      return res.items;
    }
  }

  static async getExpiredCandidateIds(nowEpoch: number): Promise<string[]> {
    const redis = getRedisClient();
    // ZRANGEBYSCORE food:expiry -inf nowEpoch
    return redis.zRangeByScore(REDIS_KEYS.foodExpiry(), 0, nowEpoch);
  }

  static async countByStatus(status: FoodStatus): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.foodByStatus(status));
  }

  static async totalCount(): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.foodAll());
  }
}
