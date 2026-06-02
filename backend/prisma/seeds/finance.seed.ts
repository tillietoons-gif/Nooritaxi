import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFinance() {
  console.log('🌱 Seeding Finance Module...');
  
  await prisma.systemCommissionRule.createMany({
    data: [
      { serviceType: 'RIDE', commissionType: 'PERCENTAGE', value: 15.0 },
      { serviceType: 'FOOD', commissionType: 'PERCENTAGE', value: 20.0 },
      { serviceType: 'DELIVERY', commissionType: 'FIXED', value: 50.0 }
    ]
  });

  console.log('✅ Finance Seeding Completed.');
}

if (require.main === module) {
  seedFinance().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
