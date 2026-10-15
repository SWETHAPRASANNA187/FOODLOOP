import { Response } from 'express';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { ActivityRepository } from '../repositories/notification.repository.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { emitRealtimeEvent } from '../sockets/index.js';
import { enqueueJob } from '../workers/index.js';

export class PickupController {
  static async getAvailable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tasks = await PickupRepository.findAvailable();
      res.status(200).json({ success: true, items: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tasks = await PickupRepository.findByVolunteer(user.id);
      res.status(200).json({ success: true, items: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async accept(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const result = await PickupRepository.claimAtomic(id, user.id, user.name);
      if (!result.success || !result.pickup) {
        res.status(409).json({ success: false, error: result.error || 'Task could not be claimed. Already accepted by another volunteer.' });
        return;
      }

      await ActivityRepository.record({
        entityId: id,
        entityType: 'PICKUP',
        action: 'PICKUP_CLAIMED',
        userId: user.id,
        userName: user.name,
        details: `Volunteer ${user.name} accepted pickup task for "${result.pickup.foodTitle}"`,
      });

      // Notify donor and recipient
      await enqueueJob('NOTIFICATION_DELIVERY', {
        userId: result.pickup.recipientId,
        title: 'Volunteer Assigned to Your Delivery',
        message: `${user.name} is picking up your food from ${result.pickup.donorAddress}!`,
        type: 'INFO',
        entityType: 'PICKUP',
        entityId: id,
      });

      await emitRealtimeEvent('pickup:claimed', result.pickup, 'role:VOLUNTEER');

      res.status(200).json({
        success: true,
        pickup: result.pickup,
        message: 'Pickup task accepted successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const user = req.user!;

      const result = await PickupRepository.updateStatus(id, status, user.id);
      if (!result.success || !result.pickup) {
        res.status(400).json({ success: false, error: result.error || 'Failed to update pickup status' });
        return;
      }

      const task = result.pickup;

      // If delivered, mark reservation completed
      if (status === 'DELIVERED') {
        await ReservationRepository.updateStatus(task.reservationId, 'COMPLETED');

        await ActivityRepository.record({
          entityId: id,
          entityType: 'PICKUP',
          action: 'PICKUP_DELIVERED',
          userId: user.id,
          userName: user.name,
          details: `Volunteer ${user.name} delivered "${task.foodTitle}" to ${task.recipientName}`,
        });

        await enqueueJob('NOTIFICATION_DELIVERY', {
          userId: task.recipientId,
          title: 'Food Rescued & Delivered!',
          message: `Your food "${task.foodTitle}" has been safely delivered by ${user.name}. Bon Appétit!`,
          type: 'SUCCESS',
          entityType: 'PICKUP',
          entityId: id,
        });

        await enqueueJob('NOTIFICATION_DELIVERY', {
          userId: task.donorId,
          title: 'Donation Successfully Completed',
          message: `Your surplus food "${task.foodTitle}" was successfully delivered to ${task.recipientName}. Thank you for preventing waste!`,
          type: 'SUCCESS',
          entityType: 'PICKUP',
          entityId: id,
        });
      }

      await emitRealtimeEvent('pickup:updated', task);

      res.status(200).json({ success: true, pickup: task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const result = await PickupRepository.cancelByVolunteer(id, user.id);
      if (!result.success || !result.pickup) {
        res.status(400).json({ success: false, error: result.error || 'Failed to cancel pickup assignment' });
        return;
      }

      await ActivityRepository.record({
        entityId: id,
        entityType: 'PICKUP',
        action: 'PICKUP_RELEASED',
        userId: user.id,
        userName: user.name,
        details: `Volunteer ${user.name} released pickup task for "${result.pickup.foodTitle}" back to available pool.`,
      });

      await emitRealtimeEvent('pickup:available', result.pickup, 'role:VOLUNTEER');
      await emitRealtimeEvent('pickup:updated', result.pickup);

      res.status(200).json({
        success: true,
        pickup: result.pickup,
        message: 'Pickup assignment released. The task is now available for other volunteers.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const items = await PickupRepository.findAll();
      res.status(200).json({ success: true, items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
