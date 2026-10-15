import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate, NotificationController.getMy);
notificationRouter.patch('/:id/read', authenticate, NotificationController.markRead);
notificationRouter.patch('/read-all', authenticate, NotificationController.markAllRead);
notificationRouter.get('/activity', authenticate, NotificationController.getRecentActivity);
