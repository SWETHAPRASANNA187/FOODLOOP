// FoodLoop Redis Key Schema Constants and Documentation
// Redis is the PRIMARY AND ONLY DATABASE for FoodLoop.

export const REDIS_KEYS = {
  // User Keys
  user: (userId: string) => `users:${userId}`,
  userByEmail: (email: string) => `users:by-email:${email.toLowerCase().trim()}`,
  usersAll: () => 'users:all', // Set of all user IDs
  usersByRole: (role: string) => `users:by-role:${role.toUpperCase()}`, // Set of user IDs for role

  // Food Keys
  food: (foodId: string) => `food:${foodId}`, // Hash of food listing details
  foodAll: () => 'food:all', // Set of all food IDs
  foodByStatus: (status: string) => `food:by-status:${status.toUpperCase()}`, // Set of food IDs by status
  foodByDonor: (donorId: string) => `food:by-donor:${donorId}`, // Set of food IDs by donor
  foodByCategory: (category: string) => `food:by-category:${category.toUpperCase()}`, // Set of food IDs by category
  foodExpiry: () => 'food:expiry', // Sorted set: score = unix timestamp of expiration, member = foodId
  foodGeo: () => 'food:geo', // Redis GEO sorted set for proximity discovery: member = foodId

  // Reservation Keys
  reservation: (reservationId: string) => `reservations:${reservationId}`, // Hash
  reservationsAll: () => 'reservations:all', // Set of all reservation IDs
  reservationsByListing: (foodId: string) => `reservations:by-listing:${foodId}`, // Set of reservation IDs
  reservationsByRecipient: (recipientId: string) => `reservations:by-recipient:${recipientId}`, // Set of reservation IDs
  reservationsByStatus: (status: string) => `reservations:by-status:${status.toUpperCase()}`,

  // Pickup Keys
  pickup: (pickupId: string) => `pickups:${pickupId}`, // Hash
  pickupsAll: () => 'pickups:all', // Set of all pickup IDs
  pickupsAvailable: () => 'pickups:available', // Set of pickup IDs eligible for volunteer claim
  pickupsByVolunteer: (volunteerId: string) => `pickups:by-volunteer:${volunteerId}`, // Set of pickup IDs
  pickupsByStatus: (status: string) => `pickups:by-status:${status.toUpperCase()}`,

  // Notifications
  notificationsUser: (userId: string) => `notifications:${userId}`, // List of serialized notifications (capped)
  notificationUnreadCount: (userId: string) => `notifications:unread-count:${userId}`, // String counter

  // Activity & Audit log
  activityList: () => 'activity:all', // List of recent activity events
  activityByEntity: (entityId: string) => `activity:${entityId}`, // List of activity for specific entity

  // Locks and Idempotency
  reservationLock: (foodId: string) => `reservation-lock:${foodId}`, // Short-lived lock string
  idempotency: (key: string) => `idempotency:${key}`, // String token with TTL for deduplication

  // Counters
  metricsPortionsRescued: () => 'metrics:portions_rescued', // String counter
  metricsDonationsCompleted: () => 'metrics:donations_completed', // String counter
  metricsPickupsCompleted: () => 'metrics:pickups_completed', // String counter

  // Streams
  streamJobs: () => 'foodloop:jobs', // Redis stream for asynchronous background jobs
  streamJobsGroup: () => 'foodloop_workers_group',
  streamJobsConsumer: (workerId: string) => `worker:${workerId}`,

  // Pub/Sub Channels
  pubsubChannel: () => 'foodloop:events',
};
