import { Response } from 'express';
import { NotificationRepository, ActivityRepository } from '../repositories/notification.repository.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class NotificationController {
  static async getMy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const items = await NotificationRepository.getForUser(user.id, limit);
      const unreadCount = await NotificationRepository.getUnreadCount(user.id);

      res.status(200).json({ success: true, items, unreadCount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      await NotificationRepository.markAsRead(user.id, id);
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      await NotificationRepository.markAllAsRead(user.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const activities = await ActivityRepository.getRecent(limit);
      res.status(200).json({ success: true, items: activities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
