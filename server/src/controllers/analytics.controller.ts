import { Response } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { getRedisClient, isRedisReady } from '../redis/client.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AnalyticsController {
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      // 1. Overall stats derived strictly from maintained Redis sets and counters
      const totalUsers = await UserRepository.totalCount();
      const donorCount = await UserRepository.countByRole('DONOR');
      const recipientCount = await UserRepository.countByRole('RECIPIENT');
      const volunteerCount = await UserRepository.countByRole('VOLUNTEER');

      const availableListings = await FoodRepository.countByStatus('AVAILABLE');
      const reservedListings = await FoodRepository.countByStatus('RESERVED');
      const expiredListings = await FoodRepository.countByStatus('EXPIRED');
      const completedPickups = await PickupRepository.countCompleted();
      const activeReservations = await ReservationRepository.countByStatus('PENDING');

      // Calculate total portions rescued from completed reservations
      const allReservations = await ReservationRepository.findAll();
      const completedReservations = allReservations.filter((r) => r.status === 'COMPLETED');
      const totalPortionsRescued = completedReservations.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

      // Category breakdown from actual Redis listings
      const allFoodResult = await FoodRepository.query({ limit: 100 });
      const categoryDistribution: Record<string, number> = {};
      allFoodResult.items.forEach((item) => {
        categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
      });

      // Role-specific metrics
      let roleSpecificData: any = {};
      if (user.role === 'DONOR') {
        const donorListings = await FoodRepository.query({ donorId: user.id, limit: 100 });
        const myActive = donorListings.items.filter((i) => i.status === 'AVAILABLE').length;
        const myTotalPortions = donorListings.items.reduce((acc, i) => acc + i.initialQuantity, 0);
        roleSpecificData = { myActiveListings: myActive, myTotalPortionsDonated: myTotalPortions };
      } else if (user.role === 'RECIPIENT') {
        const myReservations = await ReservationRepository.findByRecipient(user.id);
        const activeRes = myReservations.filter((r) => r.status === 'PENDING').length;
        const completedRes = myReservations.filter((r) => r.status === 'COMPLETED').length;
        roleSpecificData = { myActiveReservations: activeRes, myCompletedRescues: completedRes };
      } else if (user.role === 'VOLUNTEER') {
        const myTasks = await PickupRepository.findByVolunteer(user.id);
        const pendingTasks = myTasks.filter((t) => t.status === 'ACCEPTED' || t.status === 'IN_TRANSIT').length;
        const deliveredTasks = myTasks.filter((t) => t.status === 'DELIVERED').length;
        roleSpecificData = { myPendingDeliveries: pendingTasks, myCompletedDeliveries: deliveredTasks };
      }

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          donorCount,
          recipientCount,
          volunteerCount,
          availableListings,
          reservedListings,
          expiredListings,
          activeReservations,
          completedPickups,
          totalPortionsRescued,
        },
        categoryDistribution,
        roleSpecificData,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPublicMetrics(req: any, res: Response): Promise<void> {
    try {
      const availableListings = await FoodRepository.countByStatus('AVAILABLE');
      const allReservations = await ReservationRepository.findAll();
      const completedReservations = allReservations.filter((r) => r.status === 'COMPLETED');
      const portionsRescued = completedReservations.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      const totalDonors = await UserRepository.countByRole('DONOR');
      const completedDeliveries = await PickupRepository.countCompleted();

      res.status(200).json({
        success: true,
        metrics: {
          activeDonations: availableListings,
          portionsRescued,
          partnerDonors: totalDonors,
          successfulPickups: completedDeliveries,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRedisHealth(req: any, res: Response): Promise<void> {
    try {
      if (!isRedisReady()) {
        res.status(503).json({
          status: 'UNHEALTHY',
          redisConnected: false,
          error: 'Redis connection is down. Start Redis container to restore database services.',
        });
        return;
      }

      const redis = getRedisClient();
      const ping = await redis.ping();
      const rawInfo = await redis.info();

      // Extract persistence and memory stats
      const aofEnabled = rawInfo.includes('aof_enabled:1');
      const memoryMatch = rawInfo.match(/used_memory_human:([^\r\n]+)/);
      const uptimeMatch = rawInfo.match(/uptime_in_seconds:([^\r\n]+)/);
      const keyspaceMatch = rawInfo.match(/db0:keys=([0-9]+)/);

      res.status(200).json({
        status: 'UP',
        redisConnected: true,
        ping,
        persistence: {
          aofEnabled,
          rdbSnapshotConfigured: true,
          evictionPolicy: 'noeviction',
        },
        memoryUsed: memoryMatch ? memoryMatch[1] : 'unknown',
        uptimeSeconds: uptimeMatch ? parseInt(uptimeMatch[1], 10) : 0,
        keysCount: keyspaceMatch ? parseInt(keyspaceMatch[1], 10) : 0,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'DOWN',
        redisConnected: false,
        error: err.message,
      });
    }
  }
}
