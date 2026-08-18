import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findDuplicates() {
  console.log('Starting duplicate constraint diagnostics...');
  
  // List of tables to check for duplicates in the "name" column
  const tables = ['"Role"', '"Permission"', '"PermissionGroup"', '"Category"', '"Collection"', '"Color"', '"Size"'];
  
  let foundAny = false;
  
  for (const table of tables) {
    try {
      // Raw SQL query to bypass any client-side schema differences
      const query = `
        SELECT name, COUNT(*) as count
        FROM ${table} 
        GROUP BY name 
        HAVING COUNT(*) > 1;
      `;
      const res = await prisma.$queryRawUnsafe(query);
      if (res && res.length > 0) {
        foundAny = true;
        console.log(`\n❌ Table ${table} has duplicate names:`);
        res.forEach(row => {
          console.log(`   - Name: "${row.name}" appears ${row.count} times`);
        });
      } else {
        console.log(`✅ Table ${table} is clean (no duplicates).`);
      }
    } catch (err) {
      console.log(`⚠️ Table ${table} skipped: ${err.message.split('\n')[0]}`);
    }
  }
  
  if (!foundAny) {
    console.log('\n✅ No duplicates found in checked tables.');
  } else {
    console.log('\n💡 Tip: To fix the unique constraint failure, delete the duplicate entries or rename them in the database.');
  }
  
  await prisma.$disconnect();
}

findDuplicates().catch(console.error);
