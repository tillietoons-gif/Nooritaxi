const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { phone: '+93000000000' } });
  console.log(admin);
  await prisma.$disconnect();
}

main();