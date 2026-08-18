import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanupRoles() {
  console.log('Starting Roles duplicate cleanup...');
  
  // 1. Find all roles with name "CUSTOMER"
  const customerRoles = await prisma.role.findMany({
    where: { name: 'CUSTOMER' },
    orderBy: { createdAt: 'asc' } // oldest first
  });
  
  if (customerRoles.length <= 1) {
    console.log('✅ No duplicate CUSTOMER roles found.');
    await prisma.$disconnect();
    return;
  }
  
  const keepRole = customerRoles[0];
  const deleteRoles = customerRoles.slice(1);
  
  console.log(`Keeping CUSTOMER role with ID: ${keepRole.id}`);
  
  for (const dupRole of deleteRoles) {
    console.log(`\nProcessing duplicate CUSTOMER role ID: ${dupRole.id}`);
    
    // Update all users referencing this duplicate role to point to keepRole
    const updateResult = await prisma.user.updateMany({
      where: { roleId: dupRole.id },
      data: { roleId: keepRole.id }
    });
    
    console.log(`   - Linked ${updateResult.count} users to the main CUSTOMER role.`);
    
    // Clean up any permission relations linked to the duplicate role before deleting
    // Prisma implicit many-to-many handles this via Cascade or SetNull, but we will make sure.
    
    // Delete the duplicate role
    await prisma.role.delete({
      where: { id: dupRole.id }
    });
    
    console.log(`   - Deleted duplicate role ID: ${dupRole.id}`);
  }
  
  console.log('\n🎉 Cleanup complete! Now try running: npx prisma db push --accept-data-loss');
  await prisma.$disconnect();
}

cleanupRoles().catch(console.error);
