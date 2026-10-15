import { Response } from 'express';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { NotificationRepository, ActivityRepository } from '../repositories/notification.repository.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { emitRealtimeEvent } from '../sockets/index.js';
import { enqueueJob } from '../workers/index.js';

export class ReservationController {
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { foodId, quantity, idempotencyKey } = req.body;

      // 1. Fetch listing details
      const food = await FoodRepository.findById(foodId);
      if (!food) {
        res.status(404).json({ success: false, error: 'Food listing not found' });
        return;
      }

      // 2. Perform Atomic Reservation in Redis
      const result = await ReservationRepository.createAtomic({
        foodId,
        foodTitle: food.title,
        recipientId: user.id,
        recipientName: user.name,
        donorId: food.donorId,
        quantity,
        idempotencyKey,
      });

      if (!result.success || !result.reservation) {
        const errorMsg = result.error || 'Reservation could not be completed';
        const statusCode =
          errorMsg === 'INSUFFICIENT_QUANTITY' ? 409 :
          errorMsg === 'FOOD_EXPIRED' ? 410 :
          errorMsg === 'FOOD_NOT_AVAILABLE' ? 400 : 400;

        res.status(statusCode).json({ success: false, error: errorMsg });
        return;
      }

      const reservation = result.reservation;

      // 3. Automatically spawn a PickupTask for volunteers
      const pickupTask = await PickupRepository.create({
        reservationId: reservation.id,
        foodId: food.id,
        foodTitle: food.title,
        donorId: food.donorId,
        donorAddress: food.address,
        recipientId: user.id,
        recipientName: user.name,
        recipientAddress: user.address || 'Address pending confirmation',
      });

      // 4. Record audit event
      await ActivityRepository.record({
        entityId: reservation.id,
        entityType: 'RESERVATION',
        action: 'FOOD_RESERVED',
        userId: user.id,
        userName: user.name,
        details: `Reserved ${quantity} portions of "${food.title}"`,
      });

      // 5. Enqueue Notifications for Donor and Recipient
      await enqueueJob('NOTIFICATION_DELIVERY', {
        userId: food.donorId,
        title: 'New Reservation Received',
        message: `${user.name} reserved ${quantity} portions of "${food.title}".`,
        type: 'SUCCESS',
        entityType: 'RESERVATION',
        entityId: reservation.id,
      });

      await enqueueJob('NOTIFICATION_DELIVERY', {
        userId: user.id,
        title: 'Reservation Confirmed',
        message: `Your reservation for ${quantity} portions of "${food.title}" is confirmed! Pickup verification code: ${reservation.pickupCode}`,
        type: 'SUCCESS',
        entityType: 'RESERVATION',
        entityId: reservation.id,
      });

      // 6. Broadcast Real-time events
      await emitRealtimeEvent('food:reserved', {
        foodId: food.id,
        remainingQuantity: result.remainingQuantity,
      }, 'public:food');

      await emitRealtimeEvent('pickup:available', pickupTask, 'role:VOLUNTEER');

      res.status(201).json({
        success: true,
        reservation,
        pickupTask,
        message: 'Reservation created successfully and pickup task scheduled.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const reservations = await ReservationRepository.findByRecipient(user.id);
      res.status(200).json({ success: true, items: reservations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;
      const resItem = await ReservationRepository.findById(id);

      if (!resItem) {
        res.status(404).json({ success: false, error: 'Reservation not found' });
        return;
      }

      // Check authorization: recipient, donor or admin
      if (
        resItem.recipientId !== user.id &&
        resItem.donorId !== user.id &&
        user.role !== 'ADMIN'
      ) {
        res.status(403).json({ success: false, error: 'Unauthorized to view this reservation' });
        return;
      }

      res.status(200).json({ success: true, reservation: resItem });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const result = await ReservationRepository.cancelAtomic(id, user.id, user.role);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error || 'Cancellation failed' });
        return;
      }

      const resItem = await ReservationRepository.findById(id);

      await ActivityRepository.record({
        entityId: id,
        entityType: 'RESERVATION',
        action: 'RESERVATION_CANCELLED',
        userId: user.id,
        userName: user.name,
        details: `Cancelled reservation for "${resItem?.foodTitle}". Restored ${result.restoredQuantity} portions.`,
      });

      if (resItem) {
        await emitRealtimeEvent('reservation:cancelled', { reservationId: id, foodId: resItem.foodId }, 'public:food');
      }

      res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully and food inventory restored to Redis.',
        restoredQuantity: result.restoredQuantity,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const items = await ReservationRepository.findAll();
      res.status(200).json({ success: true, items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
