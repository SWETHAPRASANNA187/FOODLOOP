import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/user.repository.js';
import { ActivityRepository } from '../repositories/notification.repository.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, UserPublic } from '../types/index.js';

function sanitizeUser(user: User): UserPublic {
  const { passwordHash, ...rest } = user;
  return rest;
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, phone, organizationName, address } = req.body;

      const exists = await UserRepository.emailExists(email);
      if (exists) {
        res.status(409).json({ success: false, error: 'A user with this email address already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const newUser: User = {
        id: `usr_${uuidv4()}`,
        name,
        email,
        passwordHash,
        role,
        phone,
        organizationName,
        address,
        createdAt: now,
        updatedAt: now,
      };

      await UserRepository.create(newUser);

      await ActivityRepository.record({
        entityId: newUser.id,
        entityType: 'USER',
        action: 'USER_REGISTERED',
        userId: newUser.id,
        userName: newUser.name,
        details: `New ${newUser.role} user registered: ${newUser.name} (${newUser.email})`,
      });

      const publicUser = sanitizeUser(newUser);
      const token = jwt.sign(publicUser, config.jwtSecret, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        user: publicUser,
        token,
        message: 'Registration successful',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await UserRepository.findByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const publicUser = sanitizeUser(user);
      const token = jwt.sign(publicUser, config.jwtSecret, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        user: publicUser,
        token,
        message: 'Login successful',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Successfully logged out' });
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const freshUser = await UserRepository.findById(req.user.id);
    if (!freshUser) {
      res.status(404).json({ success: false, error: 'User record not found in Redis' });
      return;
    }
    res.status(200).json({ success: true, user: sanitizeUser(freshUser) });
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const { name, phone, address, organizationName } = req.body;
    const updated = await UserRepository.updateProfile(req.user.id, {
      name,
      phone,
      address,
      organizationName,
    });
    if (!updated) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, user: sanitizeUser(updated) });
  }
}
