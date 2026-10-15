import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRole, UserPublic } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: UserPublic;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPublic;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden: role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
