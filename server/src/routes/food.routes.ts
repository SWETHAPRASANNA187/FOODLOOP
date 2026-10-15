import { Router } from 'express';
import { FoodController } from '../controllers/food.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createFoodSchema, updateFoodSchema } from '../validators/index.js';

export const foodRouter = Router();

// Public routes for exploration and discovery
foodRouter.get('/', FoodController.query);
foodRouter.get('/nearby', FoodController.getNearby);
foodRouter.get('/:id', FoodController.getById);

// Protected routes (Donors and Admins)
foodRouter.post(
  '/',
  authenticate,
  authorizeRoles('DONOR', 'ADMIN'),
  validateBody(createFoodSchema),
  FoodController.create
);

foodRouter.patch(
  '/:id',
  authenticate,
  authorizeRoles('DONOR', 'ADMIN'),
  validateBody(updateFoodSchema),
  FoodController.update
);

foodRouter.delete(
  '/:id',
  authenticate,
  authorizeRoles('DONOR', 'ADMIN'),
  FoodController.delete
);
