import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedRbac } from './seeds/rbac.seed';

const prisma = new PrismaClient();

async function upsertUser(phone: string, role: any, name: string, password: string) {
  return prisma.user.upsert({
    where: { phone },
    update: { role, name, status: 'ACTIVE', isVerified: true },
    create: {
      phone,
      name,
      role,
      password: await bcrypt.hash(password, 10),
      status: 'ACTIVE',
      isVerified: true,
      referralCode: `NOORI${phone.replace(/\D/g, '').slice(-5)}`,
    },
  });
}

async function main() {
  // SAFETY: refuse to seed against a production DB unless explicitly opted in.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run prisma seed with NODE_ENV=production. ' +
        'Set ALLOW_PROD_SEED=true to override (NOT recommended).',
    );
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD env var must be set before running the seed. ' +
        'Pick a strong value; the admin user will be created with this password.',
    );
  }
  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '+93000000000';

  await seedRbac();

  const admin = await upsertUser(adminPhone, 'ADMIN', 'Noori Admin', adminPassword);
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  if (!superAdminRole) {
    throw new Error('Super Admin role was not seeded successfully.');
  }

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      adminId: admin.id,
      roleId: superAdminRole.id,
    },
  });

  const rider = await upsertUser('+93700000001', 'RIDER', 'Ahmad Rider', 'Rider123!');
  const driverUser = await upsertUser('+93700000002', 'DRIVER', 'Farid Driver', 'Driver123!');
  const merchant = await upsertUser('+93700000003', 'MERCHANT', 'Kabul Kitchen Owner', 'Merchant123!');

  await prisma.wallet.upsert({
    where: { userId_type_currency: { userId: rider.id, type: 'CUSTOMER', currency: 'AFN' } },
    update: {},
    create: { userId: rider.id, type: 'CUSTOMER', currency: 'AFN', balance: 2500 },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { status: 'ONLINE', tier: 'SILVER', currentLat: 34.5553, currentLng: 69.2075 },
    create: { userId: driverUser.id, status: 'ONLINE', tier: 'SILVER', currentLat: 34.5553, currentLng: 69.2075 },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: 'KBL-1001' },
    update: { driverId: driver.id, isActive: true },
    create: { driverId: driver.id, type: 'CAR', plateNumber: 'KBL-1001', make: 'Toyota', model: 'Corolla', color: 'White' },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'demo-kabul-kitchen' },
    update: { status: 'OPEN', ownerId: merchant.id },
    create: {
      id: 'demo-kabul-kitchen',
      ownerId: merchant.id,
      name: 'Kabul Kitchen',
      address: 'Shahr-e Naw, Kabul',
      cuisineTypes: ['Afghan', 'Kebab', 'Rice'],
      status: 'OPEN',
      deliveryRadius: 8,
    },
  });

  const menuItems = [
    { id: 'demo-kabuli-pulao', name: 'Kabuli Pulao', price: 350, category: 'Rice' },
    { id: 'demo-chicken-kebab', name: 'Chicken Kebab', price: 420, category: 'Grill' },
    { id: 'demo-bolani', name: 'Bolani', price: 120, category: 'Snack' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: { price: item.price, isAvailable: true },
      create: { ...item, restaurantId: restaurant.id },
    });
  }

  await prisma.promotion.upsert({
    where: { code: 'NOORI50' },
    update: { isActive: true },
    create: {
      code: 'NOORI50',
      title: 'Welcome to Noori',
      type: 'FIXED_AMOUNT',
      scope: 'GLOBAL',
      value: 50,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      isActive: true,
    },
  });

  await prisma.surgeZone.upsert({
    where: { id: 'demo-central-kabul-peak' },
    update: {
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [69.145, 34.49],
            [69.245, 34.49],
            [69.245, 34.56],
            [69.145, 34.56],
            [69.145, 34.49],
          ],
        ],
      },
      multiplier: 1.2,
      isActive: true,
      activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 6),
    },
    create: {
      id: 'demo-central-kabul-peak',
      name: 'Central Kabul Peak',
      city: 'Kabul',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [69.145, 34.49],
            [69.245, 34.49],
            [69.245, 34.56],
            [69.145, 34.56],
            [69.145, 34.49],
          ],
        ],
      },
      multiplier: 1.2,
      reason: 'Peak demand',
      activeFrom: new Date(),
      activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 6),
      isActive: true,
    },
  });

  console.log(`Seeded demo data. Admin phone: ${admin.phone}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
