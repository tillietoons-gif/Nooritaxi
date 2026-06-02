import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAirport() {
  console.log('🌱 Seeding Airport Operations...');
  
  const airport = await prisma.airport.create({
    data: {
      name: 'Kabul International Airport',
      city: 'Kabul',
      country: 'Afghanistan',
      iataCode: 'KBL',
      icaoCode: 'OAKB',
      status: 'ACTIVE',
      terminals: ['Terminal 1', 'Terminal 2'],
    }
  });

  const queueZone = await prisma.airportZone.create({
    data: {
      airportId: airport.id,
      name: 'Main Staging Area (T1)',
      type: 'WAITING',
      maxCapacity: 200,
    }
  });

  console.log('✅ Airport Seeding Completed.');
}

if (require.main === module) {
  seedAirport().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
