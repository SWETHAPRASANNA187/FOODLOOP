import { Router } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

export const adminRouter = Router();

adminRouter.use(authenticate, authorizeRoles('ADMIN'));

adminRouter.get('/users', async (req, res) => {
  try {
    const users = await UserRepository.findAll();
    const sanitized = users.map(({ passwordHash, ...rest }) => rest);
    res.status(200).json({ success: true, items: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, phone, address, organizationName, role } = req.body;
    let user = await UserRepository.updateProfile(id, { name, phone, address, organizationName });
    if (role && user) {
      user = await UserRepository.updateRole(id, role);
    }
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const { passwordHash, ...sanitized } = user;
    res.status(200).json({ success: true, user: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const success = await UserRepository.delete(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'User deleted from Redis' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/listings', async (req, res) => {
  try {
    const result = await FoodRepository.query({ limit: 100 });
    res.status(200).json({ success: true, items: result.items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.delete('/listings/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const success = await FoodRepository.delete(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Listing deleted from Redis' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/reservations', async (req, res) => {
  try {
    const items = await ReservationRepository.findAll();
    res.status(200).json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.get('/pickups', async (req, res) => {
  try {
    const items = await PickupRepository.findAll();
    res.status(200).json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.delete('/pickups/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const success = await PickupRepository.delete(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Pickup task not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Pickup task deleted from Redis' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
