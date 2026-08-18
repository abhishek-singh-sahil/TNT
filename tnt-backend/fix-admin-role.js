import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function fix() {
  console.log('Fixing Admin role alignment...');
  
  // Find SUPER_ADMIN role
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });
  
  if (!superAdminRole) {
    console.log('SUPER_ADMIN role not found. Creating it...');
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with full access'
      }
    });
  }
  
  // Find or create admin user
  const adminEmail = 'admin@tntclothing.com';
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  if (adminUser) {
    console.log(`Found existing admin user: ${adminEmail}. Updating role to SUPER_ADMIN (ID: ${superAdminRole.id})...`);
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        roleId: superAdminRole.id,
        passwordHash: adminPassword, // reset password to admin123
        isVerified: true
      }
    });
    console.log('✅ Admin user role updated successfully!');
  } else {
    console.log(`Admin user ${adminEmail} not found. Creating it...`);
    await prisma.user.create({
      data: {
        firstName: 'TNT',
        lastName: 'Super Admin',
        email: adminEmail,
        phone: '+91 99999 88888',
        passwordHash: adminPassword,
        isVerified: true,
        roleId: superAdminRole.id
      }
    });
    console.log('✅ Admin user created successfully!');
  }
  
  await prisma.$disconnect();
}

fix().catch(console.error);
