import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReservationSchema } from '../validators/index.js';

export const reservationRouter = Router();

// Create reservation (RECIPIENT or ADMIN)
reservationRouter.post(
  '/',
  authenticate,
  authorizeRoles('RECIPIENT', 'ADMIN'),
  validateBody(createReservationSchema),
  ReservationController.create
);

// Get my reservations (RECIPIENT or ADMIN)
reservationRouter.get('/my', authenticate, ReservationController.getMy);

// Admin get all reservations
reservationRouter.get('/all', authenticate, authorizeRoles('ADMIN'), ReservationController.getAll);

// Get single reservation by ID
reservationRouter.get('/:id', authenticate, ReservationController.getById);

// Cancel reservation
reservationRouter.patch('/:id/cancel', authenticate, ReservationController.cancel);
