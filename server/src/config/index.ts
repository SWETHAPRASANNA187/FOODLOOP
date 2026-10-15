import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret_foodloop_change_in_prod',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie_secret_fallback',
  isProduction: process.env.NODE_ENV === 'production',
};
