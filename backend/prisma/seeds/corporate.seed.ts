import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCorporate() {
  console.log('🌱 Seeding Corporate Accounts...');
  
  const org = await prisma.organization.create({
    data: {
      companyName: 'Roshan Telecommunications',
      legalName: 'Telecom Development Company Afghanistan',
      industry: 'Telecommunications',
      email: 'travel@roshan.af',
      phone: '+93799000000',
      city: 'Kabul',
      status: 'APPROVED',
      wallet: { create: { currency: 'AFN', creditLimit: 500000 } },
    }
  });

  const dept = await prisma.department.create({
    data: { organizationId: org.id, name: 'Sales & Marketing' }
  });

  await prisma.employee.create({
    data: {
      organizationId: org.id,
      departmentId: dept.id,
      name: 'Ahmad Jan',
      email: 'ahmad@roshan.af',
      phone: '+93799111222',
      jobTitle: 'Sales Executive',
      role: 'EMPLOYEE',
    }
  });

  console.log('✅ Corporate Seeding Completed.');
}

if (require.main === module) {
  seedCorporate().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
