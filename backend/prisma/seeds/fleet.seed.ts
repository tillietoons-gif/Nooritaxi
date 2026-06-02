import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFleets() {
  console.log('🌱 Seeding Fleets...');
  
  const fleet1 = await prisma.fleet.upsert({
    where: { email: 'contact@kabulrapid.af' },
    update: {},
    create: {
      companyName: 'Kabul Rapid Transit',
      ownerName: 'Ahmad Shah',
      email: 'contact@kabulrapid.af',
      phone: '+93700000001',
      address: 'Share Naw, Kabul',
      taxNumber: 'TX-12345',
      status: 'APPROVED',
      cityId: 'Kabul'
    }
  });

  const fleet2 = await prisma.fleet.upsert({
    where: { email: 'info@heratmobility.af' },
    update: {},
    create: {
      companyName: 'Herat Mobility Solutions',
      ownerName: 'Zubair Ansari',
      email: 'info@heratmobility.af',
      phone: '+93700000002',
      address: 'Central Herat',
      taxNumber: 'TX-98765',
      status: 'APPROVED',
      cityId: 'Herat'
    }
  });

  // Commission Rule
  await prisma.fleetCommissionRule.createMany({
    data: [
      { fleetId: fleet1.id, type: 'PERCENTAGE', value: 12.0 },
      { fleetId: fleet2.id, type: 'PERCENTAGE', value: 15.0 },
    ]
  });

  console.log('✅ Fleets Seeding Completed.');
}

if (require.main === module) {
  seedFleets().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
