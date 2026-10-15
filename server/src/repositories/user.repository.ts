import { getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { User, UserRole } from '../types/index.js';

export class UserRepository {
  static async create(user: User): Promise<User> {
    const redis = getRedisClient();
    const userKey = REDIS_KEYS.user(user.id);
    const emailKey = REDIS_KEYS.userByEmail(user.email);

    // Watch email key for uniqueness race conditions
    const multi = redis.multi();
    multi.set(emailKey, user.id);
    multi.hSet(userKey, {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      passwordHash: user.passwordHash,
      role: user.role,
      phone: user.phone || '',
      organizationName: user.organizationName || '',
      address: user.address || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    multi.sAdd(REDIS_KEYS.usersAll(), user.id);
    multi.sAdd(REDIS_KEYS.usersByRole(user.role), user.id);

    await multi.exec();
    return user;
  }

  static async findById(id: string): Promise<User | null> {
    const redis = getRedisClient();
    const data = await redis.hGetAll(REDIS_KEYS.user(id));
    if (!data || Object.keys(data).length === 0 || !data.id) {
      return null;
    }
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role as UserRole,
      phone: data.phone || undefined,
      organizationName: data.organizationName || undefined,
      address: data.address || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const redis = getRedisClient();
    const userId = await redis.get(REDIS_KEYS.userByEmail(email));
    if (!userId) return null;
    return this.findById(userId);
  }

  static async emailExists(email: string): Promise<boolean> {
    const redis = getRedisClient();
    const exists = await redis.exists(REDIS_KEYS.userByEmail(email));
    return exists === 1;
  }

  static async findAll(): Promise<User[]> {
    const redis = getRedisClient();
    const userIds = await redis.sMembers(REDIS_KEYS.usersAll());
    if (userIds.length === 0) return [];

    const users: User[] = [];
    for (const id of userIds) {
      const user = await this.findById(id);
      if (user) users.push(user);
    }
    return users;
  }

  static async countByRole(role: UserRole): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.usersByRole(role));
  }

  static async totalCount(): Promise<number> {
    const redis = getRedisClient();
    return redis.sCard(REDIS_KEYS.usersAll());
  }

  static async updateProfile(id: string, updates: Partial<Pick<User, 'name' | 'phone' | 'address' | 'organizationName'>>): Promise<User | null> {
    const redis = getRedisClient();
    const user = await this.findById(id);
    if (!user) return null;

    const userKey = REDIS_KEYS.user(id);
    const hashUpdates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.name) hashUpdates.name = updates.name;
    if (updates.phone !== undefined) hashUpdates.phone = updates.phone;
    if (updates.address !== undefined) hashUpdates.address = updates.address;
    if (updates.organizationName !== undefined) hashUpdates.organizationName = updates.organizationName;

    await redis.hSet(userKey, hashUpdates);
    return this.findById(id);
  }

  static async updateRole(id: string, role: UserRole): Promise<User | null> {
    const redis = getRedisClient();
    const user = await this.findById(id);
    if (!user) return null;

    const oldRole = user.role;
    const userKey = REDIS_KEYS.user(id);

    const multi = redis.multi();
    multi.hSet(userKey, {
      role,
      updatedAt: new Date().toISOString(),
    });
    multi.sRem(REDIS_KEYS.usersByRole(oldRole), id);
    multi.sAdd(REDIS_KEYS.usersByRole(role), id);
    await multi.exec();

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const redis = getRedisClient();
    const user = await this.findById(id);
    if (!user) return false;

    const multi = redis.multi();
    multi.del(REDIS_KEYS.user(id));
    multi.del(REDIS_KEYS.userByEmail(user.email));
    multi.sRem(REDIS_KEYS.usersAll(), id);
    multi.sRem(REDIS_KEYS.usersByRole(user.role), id);
    multi.del(REDIS_KEYS.notificationsUser(id));
    multi.del(REDIS_KEYS.notificationUnreadCount(id));
    await multi.exec();

    return true;
  }
}
