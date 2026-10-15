import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/index.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), AuthController.register);
authRouter.post('/login', validateBody(loginSchema), AuthController.login);
authRouter.post('/logout', AuthController.logout);
authRouter.get('/me', authenticate, AuthController.me);
authRouter.patch('/profile', authenticate, AuthController.updateProfile);
