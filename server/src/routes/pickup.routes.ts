import { Router } from 'express';
import { PickupController } from '../controllers/pickup.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updatePickupStatusSchema } from '../validators/index.js';

export const pickupRouter = Router();

// Volunteers and Admins get available tasks
pickupRouter.get(
  '/available',
  authenticate,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  PickupController.getAvailable
);

// Volunteer get assigned tasks
pickupRouter.get(
  '/my',
  authenticate,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  PickupController.getMy
);

// Volunteer accepts a task atomically
pickupRouter.post(
  '/:id/accept',
  authenticate,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  PickupController.accept
);

// Volunteer updates delivery status
pickupRouter.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  validateBody(updatePickupStatusSchema),
  PickupController.updateStatus
);

// Volunteer cancels/releases pickup assignment
pickupRouter.patch(
  '/:id/cancel',
  authenticate,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  PickupController.cancel
);

// Admin get all pickups
pickupRouter.get(
  '/all',
  authenticate,
  authorizeRoles('ADMIN'),
  PickupController.getAll
);
