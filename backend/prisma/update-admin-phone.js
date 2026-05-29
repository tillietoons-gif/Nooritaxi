const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.update({
    where: { phone: '+93000000000' },
    data: { phone: '+93774920490' },
  });
  console.log('Updated admin:', updated);
  await prisma.$disconnect();
}

main();