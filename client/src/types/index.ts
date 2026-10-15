export type UserRole = 'DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN';

export type FoodStatus = 'AVAILABLE' | 'RESERVED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export type FoodCategory =
  | 'COOKED_MEALS'
  | 'BAKERY'
  | 'GROCERIES'
  | 'PRODUCE'
  | 'DAIRY'
  | 'BEVERAGES'
  | 'PACKAGED'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organizationName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListing {
  id: string;
  donorId: string;
  donorName: string;
  donorOrg?: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  initialQuantity: number;
  quantityUnit: string;
  preparedTime: string;
  expirationTime: string;
  pickupStartTime: string;
  pickupEndTime: string;
  address: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  allergenInfo?: string;
  storageInstructions?: string;
  status: FoodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  foodId: string;
  foodTitle: string;
  recipientId: string;
  recipientName: string;
  donorId: string;
  quantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';
  pickupCode: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
}

export interface PickupTask {
  id: string;
  reservationId: string;
  foodId: string;
  foodTitle: string;
  donorId: string;
  donorAddress: string;
  recipientId: string;
  recipientName: string;
  recipientAddress: string;
  volunteerId?: string;
  volunteerName?: string;
  status: 'AVAILABLE' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  entityType?: 'FOOD' | 'RESERVATION' | 'PICKUP';
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  entityId: string;
  entityType: 'USER' | 'FOOD' | 'RESERVATION' | 'PICKUP' | 'SYSTEM';
  action: string;
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
}
