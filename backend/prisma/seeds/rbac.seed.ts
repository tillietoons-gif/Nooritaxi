import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPermissions = [
  { module: 'dashboard', action: 'view', name: 'dashboard.view', description: 'View main dashboard metrics' },
  
  { module: 'users', action: 'view', name: 'users.view', description: 'View riders and users' },
  { module: 'users', action: 'create', name: 'users.create', description: 'Create new users' },
  { module: 'users', action: 'edit', name: 'users.edit', description: 'Edit user profiles' },
  { module: 'users', action: 'delete', name: 'users.delete', description: 'Delete users' },
  
  { module: 'drivers', action: 'view', name: 'drivers.view', description: 'View drivers and their status' },
  { module: 'drivers', action: 'create', name: 'drivers.create', description: 'Create new drivers' },
  { module: 'drivers', action: 'edit', name: 'drivers.edit', description: 'Edit driver profiles' },
  { module: 'drivers', action: 'suspend', name: 'drivers.suspend', description: 'Suspend drivers' },
  { module: 'drivers', action: 'verify', name: 'drivers.verify', description: 'Verify driver KYC documents' },
  
  { module: 'merchants', action: 'view', name: 'merchants.view', description: 'View merchants and stores' },
  { module: 'merchants', action: 'approve', name: 'merchants.approve', description: 'Approve new merchants' },
  { module: 'merchants', action: 'suspend', name: 'merchants.suspend', description: 'Suspend merchants' },
  
  { module: 'trips', action: 'view', name: 'trips.view', description: 'View trip history and live tracking' },
  { module: 'trips', action: 'cancel', name: 'trips.cancel', description: 'Cancel active trips' },
  { module: 'trips', action: 'assign', name: 'trips.assign', description: 'Manually assign drivers to trips' },
  
  { module: 'wallets', action: 'view', name: 'wallets.view', description: 'View user and driver wallets' },
  { module: 'wallets', action: 'adjust', name: 'wallets.adjust', description: 'Manually adjust wallet balances' },
  
  { module: 'finance', action: 'view', name: 'finance.view', description: 'View settlements and revenue' },
  { module: 'finance', action: 'export', name: 'finance.export', description: 'Export financial reports' },
  
  { module: 'reports', action: 'view', name: 'reports.view', description: 'View analytics and reports' },
  { module: 'reports', action: 'export', name: 'reports.export', description: 'Export analytics data' },
  
  { module: 'support', action: 'view', name: 'support.view', description: 'View support tickets and SOS alerts' },
  { module: 'support', action: 'reply', name: 'support.reply', description: 'Reply to and resolve support tickets' },
  
  { module: 'marketing', action: 'view', name: 'marketing.view', description: 'View promotions and loyalty' },
  { module: 'marketing', action: 'manage', name: 'marketing.manage', description: 'Manage promotions and loyalty tiers' },
  
  { module: 'roles', action: 'view', name: 'roles.view', description: 'View RBAC roles' },
  { module: 'roles', action: 'create', name: 'roles.create', description: 'Create custom roles' },
  { module: 'roles', action: 'edit', name: 'roles.edit', description: 'Edit custom roles' },
  { module: 'roles', action: 'delete', name: 'roles.delete', description: 'Delete custom roles' },
  
  { module: 'admins', action: 'view', name: 'admins.view', description: 'View admin users' },
  { module: 'admins', action: 'create', name: 'admins.create', description: 'Create admin users' },
  { module: 'admins', action: 'edit', name: 'admins.edit', description: 'Edit admin users' },
  { module: 'admins', action: 'delete', name: 'admins.delete', description: 'Delete admin users' },
];

const defaultRoles = [
  {
    name: 'Super Admin',
    description: 'Full access to everything. Cannot be restricted.',
    isSystem: true,
    permissions: ['*'] // Handled specially
  },
  {
    name: 'Operations Admin',
    description: 'Manage trips, drivers, live tracking, SOS, and dispatch.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'drivers.view', 'drivers.edit', 'trips.view', 'trips.cancel', 'trips.assign', 'support.view', 'reports.view'
    ]
  },
  {
    name: 'Support Admin',
    description: 'Manage support tickets, complaints, refunds, and reviews.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'support.view', 'support.reply', 'trips.view', 'users.view', 'wallets.view'
    ]
  },
  {
    name: 'Finance Admin',
    description: 'Manage wallets, transactions, settlements, and payouts.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'wallets.view', 'wallets.adjust', 'finance.view', 'finance.export', 'reports.view'
    ]
  },
  {
    name: 'Merchant Admin',
    description: 'Manage restaurants, menus, and merchant approvals.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'merchants.view', 'merchants.approve', 'merchants.suspend', 'support.view'
    ]
  },
  {
    name: 'City Admin',
    description: 'City-scoped operations (Assign cityScope when creating admin).',
    isSystem: true,
    permissions: [
      'dashboard.view', 'drivers.view', 'users.view', 'trips.view', 'support.view'
    ]
  },
  {
    name: 'KYC Admin',
    description: 'Driver and Merchant document verification.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'drivers.view', 'drivers.verify', 'merchants.view', 'merchants.approve', 'users.view'
    ]
  },
  {
    name: 'Marketing Admin',
    description: 'Manage coupons, promotions, loyalty, and push notifications.',
    isSystem: true,
    permissions: [
      'dashboard.view', 'marketing.view', 'marketing.manage', 'users.view', 'reports.view'
    ]
  }
];

export async function seedRbac() {
  console.log('🌱 Seeding RBAC Permissions and Roles...');
  
  // Seed permissions
  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }
  
  const allPermissions = await prisma.permission.findMany();
  
  // Seed roles
  for (const r of defaultRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: r.isSystem },
      create: { name: r.name, description: r.description, isSystem: r.isSystem },
    });
    
    // Assign permissions
    let rolePerms = r.permissions;
    if (rolePerms[0] === '*') {
      rolePerms = allPermissions.map(p => p.name);
    }
    
    const permsToAdd = allPermissions.filter(p => rolePerms.includes(p.name));
    
    // Clean old permissions and reset
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permsToAdd.map(p => ({
        roleId: role.id,
        permissionId: p.id,
      }))
    });
  }

  console.log('✅ RBAC Seeding Completed.');
}

// Automatically run if called directly
if (require.main === module) {
  seedRbac().then(() => prisma.$disconnect()).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
