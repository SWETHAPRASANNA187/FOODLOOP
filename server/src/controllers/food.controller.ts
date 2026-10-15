import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FoodRepository } from '../repositories/food.repository.js';
import { ActivityRepository, NotificationRepository } from '../repositories/notification.repository.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { emitRealtimeEvent } from '../sockets/index.js';
import { FoodListing } from '../types/index.js';

export class FoodController {
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const foodData = req.body;

      const now = new Date().toISOString();
      const listing: FoodListing = {
        id: `food_${uuidv4()}`,
        donorId: user.id,
        donorName: user.name,
        donorOrg: user.organizationName,
        title: foodData.title,
        description: foodData.description,
        category: foodData.category,
        quantity: foodData.quantity,
        initialQuantity: foodData.quantity,
        quantityUnit: foodData.quantityUnit,
        preparedTime: foodData.preparedTime,
        expirationTime: foodData.expirationTime,
        pickupStartTime: foodData.pickupStartTime,
        pickupEndTime: foodData.pickupEndTime,
        address: foodData.address,
        latitude: foodData.latitude,
        longitude: foodData.longitude,
        imageUrl: foodData.imageUrl,
        allergenInfo: foodData.allergenInfo,
        storageInstructions: foodData.storageInstructions,
        status: 'AVAILABLE',
        createdAt: now,
        updatedAt: now,
      };

      const created = await FoodRepository.create(listing);

      await ActivityRepository.record({
        entityId: created.id,
        entityType: 'FOOD',
        action: 'FOOD_LISTED',
        userId: user.id,
        userName: user.name,
        details: `Donor listed ${created.quantity} ${created.quantityUnit} of "${created.title}"`,
      });

      // Realtime announcement
      await emitRealtimeEvent('food:created', created, 'public:food');

      res.status(201).json({ success: true, food: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const food = await FoodRepository.findById(id);
      if (!food) {
        res.status(404).json({ success: false, error: 'Food listing not found' });
        return;
      }
      res.status(200).json({ success: true, food });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async query(req: Request, res: Response): Promise<void> {
    try {
      const { category, status, donorId, search, sortBy, page, limit } = req.query;

      const result = await FoodRepository.query({
        category: category as any,
        status: status as any,
        donorId: donorId as string,
        search: search as string,
        sortBy: sortBy as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
      });

      res.status(200).json({
        success: true,
        items: result.items,
        total: result.total,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getNearby(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) {
        res.status(400).json({ success: false, error: 'Latitude and longitude coordinates are required' });
        return;
      }

      const listings = await FoodRepository.findNearby(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius ? parseFloat(radius as string) : 25
      );

      res.status(200).json({ success: true, items: listings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;
      const existing = await FoodRepository.findById(id);

      if (!existing) {
        res.status(404).json({ success: false, error: 'Food listing not found' });
        return;
      }

      // Authorization: Only owner donor or ADMIN can edit
      if (existing.donorId !== user.id && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Unauthorized to edit this listing' });
        return;
      }

      const updated = await FoodRepository.update(id, req.body);
      await emitRealtimeEvent('food:updated', updated, 'public:food');

      res.status(200).json({ success: true, food: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;
      const existing = await FoodRepository.findById(id);

      if (!existing) {
        res.status(404).json({ success: false, error: 'Food listing not found' });
        return;
      }

      if (existing.donorId !== user.id && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Unauthorized to delete this listing' });
        return;
      }

      await FoodRepository.delete(id);
      await emitRealtimeEvent('food:deleted', { id }, 'public:food');

      res.status(200).json({ success: true, message: 'Food listing deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
