import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN']),
  phone: z.string().optional(),
  organizationName: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createFoodSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'COOKED_MEALS',
    'BAKERY',
    'GROCERIES',
    'PRODUCE',
    'DAIRY',
    'BEVERAGES',
    'PACKAGED',
    'OTHER',
  ]),
  quantity: z.number().positive('Quantity must be greater than 0'),
  quantityUnit: z.string().min(1, 'Quantity unit is required (e.g. portions, kg, boxes)'),
  preparedTime: z.string().datetime({ message: 'Invalid ISO prepared time' }),
  expirationTime: z.string().datetime({ message: 'Invalid ISO expiration time' }),
  pickupStartTime: z.string().datetime({ message: 'Invalid ISO pickup start time' }),
  pickupEndTime: z.string().datetime({ message: 'Invalid ISO pickup end time' }),
  address: z.string().min(5, 'Valid address is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  allergenInfo: z.string().optional(),
  storageInstructions: z.string().optional(),
});

export const updateFoodSchema = createFoodSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'RESERVED', 'COMPLETED', 'EXPIRED', 'CANCELLED']).optional(),
});

export const createReservationSchema = z.object({
  foodId: z.string().min(1, 'Food ID is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  idempotencyKey: z.string().optional(),
});

export const updatePickupStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
});
