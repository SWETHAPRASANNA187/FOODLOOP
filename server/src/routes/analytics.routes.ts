import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', authenticate, AnalyticsController.getDashboard);
analyticsRouter.get('/public', AnalyticsController.getPublicMetrics);
analyticsRouter.get('/redis-health', AnalyticsController.getRedisHealth);
