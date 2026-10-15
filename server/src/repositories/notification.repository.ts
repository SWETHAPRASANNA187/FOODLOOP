import { getRedisClient } from '../redis/client.js';
import { REDIS_KEYS } from '../redis/keys.js';
import { Notification, ActivityEvent } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository {
  static async create(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    const redis = getRedisClient();
    const notif: Notification = {
      ...data,
      id: `notif_${uuidv4()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const notifKey = REDIS_KEYS.notificationsUser(data.userId);
    const unreadKey = REDIS_KEYS.notificationUnreadCount(data.userId);

    const multi = redis.multi();
    // Prepend to capped list (limit 100 per user)
    multi.lPush(notifKey, JSON.stringify(notif));
    multi.lTrim(notifKey, 0, 99);
    multi.incr(unreadKey);
    await multi.exec();

    return notif;
  }

  static async getForUser(userId: string, limit: number = 20): Promise<Notification[]> {
    const redis = getRedisClient();
    const rawList = await redis.lRange(REDIS_KEYS.notificationsUser(userId), 0, limit - 1);
    const items: Notification[] = [];
    for (const raw of rawList) {
      try {
        items.push(JSON.parse(raw));
      } catch {}
    }
    return items;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const redis = getRedisClient();
    const count = await redis.get(REDIS_KEYS.notificationUnreadCount(userId));
    return count ? Math.max(0, parseInt(count, 10)) : 0;
  }

  static async markAsRead(userId: string, notifId: string): Promise<boolean> {
    const redis = getRedisClient();
    const notifKey = REDIS_KEYS.notificationsUser(userId);
    const items = await this.getForUser(userId, 100);

    let updated = false;
    const newItems = items.map((item) => {
      if (item.id === notifId && !item.read) {
        item.read = true;
        updated = true;
      }
      return item;
    });

    if (updated) {
      const multi = redis.multi();
      multi.del(notifKey);
      for (let i = newItems.length - 1; i >= 0; i--) {
        multi.lPush(notifKey, JSON.stringify(newItems[i]));
      }
      multi.decr(REDIS_KEYS.notificationUnreadCount(userId));
      await multi.exec();
    }

    return updated;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const redis = getRedisClient();
    const notifKey = REDIS_KEYS.notificationsUser(userId);
    const items = await this.getForUser(userId, 100);

    const updated = items.map((item) => ({ ...item, read: true }));
    const multi = redis.multi();
    multi.del(notifKey);
    for (let i = updated.length - 1; i >= 0; i--) {
      multi.lPush(notifKey, JSON.stringify(updated[i]));
    }
    multi.set(REDIS_KEYS.notificationUnreadCount(userId), '0');
    await multi.exec();
  }
}

export class ActivityRepository {
  static async record(data: Omit<ActivityEvent, 'id' | 'createdAt'>): Promise<ActivityEvent> {
    const redis = getRedisClient();
    const event: ActivityEvent = {
      ...data,
      id: `act_${uuidv4()}`,
      createdAt: new Date().toISOString(),
    };

    const multi = redis.multi();
    multi.lPush(REDIS_KEYS.activityList(), JSON.stringify(event));
    multi.lTrim(REDIS_KEYS.activityList(), 0, 199); // Keep latest 200 activity events
    if (data.entityId) {
      multi.lPush(REDIS_KEYS.activityByEntity(data.entityId), JSON.stringify(event));
      multi.lTrim(REDIS_KEYS.activityByEntity(data.entityId), 0, 49);
    }
    await multi.exec();

    return event;
  }

  static async getRecent(limit: number = 30): Promise<ActivityEvent[]> {
    const redis = getRedisClient();
    const rawList = await redis.lRange(REDIS_KEYS.activityList(), 0, limit - 1);
    const events: ActivityEvent[] = [];
    for (const raw of rawList) {
      try {
        events.push(JSON.parse(raw));
      } catch {}
    }
    return events;
  }
}
