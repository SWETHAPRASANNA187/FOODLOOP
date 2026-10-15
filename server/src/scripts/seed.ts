import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { initRedis, closeRedis } from '../redis/client.js';
import { UserRepository } from '../repositories/user.repository.js';
import { FoodRepository } from '../repositories/food.repository.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';
import { PickupRepository } from '../repositories/pickup.repository.js';
import { NotificationRepository, ActivityRepository } from '../repositories/notification.repository.js';
import { User, FoodListing } from '../types/index.js';

async function seed() {
  console.log('🌱 Starting FoodLoop Redis development seed...');
  await initRedis();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const now = new Date();

  // 1. Seed Demo Users
  const usersToSeed: Omit<User, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'usr_admin_1',
      name: 'System Administrator',
      email: 'admin@foodloop.org',
      passwordHash,
      role: 'ADMIN',
      phone: '+1-555-0100',
      organizationName: 'FoodLoop Foundation',
      address: '100 Green Planet Way, Metro City',
    },
    {
      id: 'usr_donor_1',
      name: 'Sunrise Artisan Bakery',
      email: 'sunrise@bakery.com',
      passwordHash,
      role: 'DONOR',
      phone: '+1-555-0101',
      organizationName: 'Sunrise Bakery Co.',
      address: '42 Baker Street, Downtown',
    },
    {
      id: 'usr_donor_2',
      name: 'Harvest Grand Hotel',
      email: 'kitchen@harvesthotel.com',
      passwordHash,
      role: 'DONOR',
      phone: '+1-555-0102',
      organizationName: 'Harvest Hospitality Group',
      address: '77 Ocean Drive, Waterfront District',
    },
    {
      id: 'usr_recipient_1',
      name: 'Hope Community Shelter',
      email: 'shelter@hopecommunity.org',
      passwordHash,
      role: 'RECIPIENT',
      phone: '+1-555-0103',
      organizationName: 'Hope Community NGO',
      address: '12 Charity Lane, Metro City',
    },
    {
      id: 'usr_recipient_2',
      name: 'City Youth Hostel',
      email: 'warden@cityhostel.edu',
      passwordHash,
      role: 'RECIPIENT',
      phone: '+1-555-0104',
      organizationName: 'University Campus Housing',
      address: '500 Campus Blvd, North Hill',
    },
    {
      id: 'usr_volunteer_1',
      name: 'Alex Johnson',
      email: 'alex.volunteer@gmail.com',
      passwordHash,
      role: 'VOLUNTEER',
      phone: '+1-555-0105',
      organizationName: 'FoodLoop Rescue Squad',
      address: '18 Elm Street, Apt 4B',
    },
  ];

  for (const u of usersToSeed) {
    const existing = await UserRepository.findByEmail(u.email);
    if (!existing) {
      await UserRepository.create({
        ...u,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      console.log(`  👤 Seeded user: ${u.name} (${u.role})`);
    } else {
      console.log(`  ℹ️ User already exists: ${u.email}`);
    }
  }

  // 2. Seed Food Listings
  const foodListingsToSeed: Omit<FoodListing, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'food_seed_1',
      donorId: 'usr_donor_1',
      donorName: 'Sunrise Artisan Bakery',
      donorOrg: 'Sunrise Bakery Co.',
      title: 'Fresh Sourdough Loaves & Croissants',
      description: 'Delightful artisanal French croissants and sourdough batards baked fresh this morning. Safe, hygienic and packed in food-grade bakery bags.',
      category: 'BAKERY',
      quantity: 25,
      initialQuantity: 25,
      quantityUnit: 'items',
      preparedTime: new Date(now.getTime() - 4 * 3600000).toISOString(),
      expirationTime: new Date(now.getTime() + 24 * 3600000).toISOString(), // expires in 24h
      pickupStartTime: new Date(now.getTime() + 1800000).toISOString(),
      pickupEndTime: new Date(now.getTime() + 12 * 3600000).toISOString(),
      address: '42 Baker Street, Downtown',
      latitude: 40.7128,
      longitude: -74.006,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      allergenInfo: 'Gluten, Dairy (butter in croissants)',
      storageInstructions: 'Store in cool dry place or reheat in oven at 180°C',
      status: 'AVAILABLE',
    },
    {
      id: 'food_seed_2',
      donorId: 'usr_donor_2',
      donorName: 'Harvest Grand Hotel',
      donorOrg: 'Harvest Hospitality Group',
      title: 'Gourmet Vegetable Biryani & Paneer Curry',
      description: 'Surplus buffet banquet feast prepared for a luncheon conference. Kept strictly above 65°C hot holding standard. Packed in thermal containers.',
      category: 'COOKED_MEALS',
      quantity: 50,
      initialQuantity: 50,
      quantityUnit: 'portions',
      preparedTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expirationTime: new Date(now.getTime() + 8 * 3600000).toISOString(), // expires in 8h
      pickupStartTime: new Date(now.getTime() + 900000).toISOString(),
      pickupEndTime: new Date(now.getTime() + 6 * 3600000).toISOString(),
      address: '77 Ocean Drive, Waterfront District',
      latitude: 40.7145,
      longitude: -74.012,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      allergenInfo: 'Dairy (paneer)',
      storageInstructions: 'Keep refrigerated below 4°C or consume immediately upon pickup',
      status: 'AVAILABLE',
    },
    {
      id: 'food_seed_3',
      donorId: 'usr_donor_1',
      donorName: 'Sunrise Artisan Bakery',
      donorOrg: 'Sunrise Bakery Co.',
      title: 'Organic Whole Wheat Sandwiches & Wraps',
      description: 'Pre-packaged roasted mediterranean vegetable and hummus wraps. Individually sealed in biodegradable wrapping.',
      category: 'COOKED_MEALS',
      quantity: 30,
      initialQuantity: 30,
      quantityUnit: 'boxes',
      preparedTime: new Date(now.getTime() - 3 * 3600000).toISOString(),
      expirationTime: new Date(now.getTime() + 16 * 3600000).toISOString(),
      pickupStartTime: new Date(now.getTime() + 600000).toISOString(),
      pickupEndTime: new Date(now.getTime() + 10 * 3600000).toISOString(),
      address: '42 Baker Street, Downtown',
      latitude: 40.7128,
      longitude: -74.006,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      allergenInfo: 'Sesame (hummus), Gluten',
      storageInstructions: 'Keep chilled',
      status: 'AVAILABLE',
    },
    {
      id: 'food_seed_4',
      donorId: 'usr_donor_2',
      donorName: 'Harvest Grand Hotel',
      donorOrg: 'Harvest Hospitality Group',
      title: 'Assorted Fruit Platters & Salads',
      description: 'Chilled watermelon, pineapple, fresh berries, and tossed garden greens with vinaigrette on the side.',
      category: 'PRODUCE',
      quantity: 40,
      initialQuantity: 40,
      quantityUnit: 'servings',
      preparedTime: new Date(now.getTime() - 1 * 3600000).toISOString(),
      expirationTime: new Date(now.getTime() + 14 * 3600000).toISOString(),
      pickupStartTime: new Date(now.getTime() + 1200000).toISOString(),
      pickupEndTime: new Date(now.getTime() + 8 * 3600000).toISOString(),
      address: '77 Ocean Drive, Waterfront District',
      latitude: 40.7145,
      longitude: -74.012,
      imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80',
      allergenInfo: 'None known',
      storageInstructions: 'Keep chilled below 5°C',
      status: 'AVAILABLE',
    },
  ];

  for (const f of foodListingsToSeed) {
    const existing = await FoodRepository.findById(f.id);
    if (!existing) {
      await FoodRepository.create({
        ...f,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      console.log(`  🍲 Seeded food listing: ${f.title}`);
    } else {
      console.log(`  ℹ️ Listing already exists: ${f.title}`);
    }
  }

  // 3. Seed an active test reservation and pickup task
  const testFood = await FoodRepository.findById('food_seed_2');
  if (testFood && testFood.quantity >= 10) {
    const resResult = await ReservationRepository.createAtomic({
      foodId: testFood.id,
      foodTitle: testFood.title,
      recipientId: 'usr_recipient_1',
      recipientName: 'Hope Community Shelter',
      donorId: testFood.donorId,
      quantity: 10,
    });

    if (resResult.success && resResult.reservation) {
      console.log(`  📦 Seeded sample reservation for 10 portions`);

      const pickup = await PickupRepository.create({
        reservationId: resResult.reservation.id,
        foodId: testFood.id,
        foodTitle: testFood.title,
        donorId: testFood.donorId,
        donorAddress: testFood.address,
        recipientId: 'usr_recipient_1',
        recipientName: 'Hope Community Shelter',
        recipientAddress: '12 Charity Lane, Metro City',
      });
      console.log(`  🚚 Seeded sample pickup task: ${pickup.id}`);

      // Seed Notifications
      await NotificationRepository.create({
        userId: 'usr_recipient_1',
        title: 'Reservation Ready for Collection',
        message: `Your reservation for 10 portions of "${testFood.title}" is ready! Verification code: ${resResult.reservation.pickupCode}`,
        type: 'SUCCESS',
        entityType: 'RESERVATION',
        entityId: resResult.reservation.id,
      });

      await NotificationRepository.create({
        userId: 'usr_donor_2',
        title: 'Reservation Confirmed',
        message: `Hope Community Shelter reserved 10 portions of "${testFood.title}".`,
        type: 'INFO',
        entityType: 'RESERVATION',
        entityId: resResult.reservation.id,
      });
    }
  }

  // Record seed activity
  await ActivityRepository.record({
    entityId: 'seed_event',
    entityType: 'SYSTEM',
    action: 'SYSTEM_INITIALIZED',
    userId: 'usr_admin_1',
    userName: 'System Administrator',
    details: 'FoodLoop sample seed data initialized into Redis successfully.',
  });

  console.log('✅ Seed completed successfully! Demo accounts available:');
  console.log('   Admin:      admin@foodloop.org / Password123!');
  console.log('   Donor:      sunrise@bakery.com / Password123!');
  console.log('   Recipient:  shelter@hopecommunity.org / Password123!');
  console.log('   Volunteer:  alex.volunteer@gmail.com / Password123!');

  await closeRedis();
}

seed().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
