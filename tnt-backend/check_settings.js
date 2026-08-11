import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findUnique({
    where: { id: 'default-settings' }
  });
  console.log('SYSTEM SETTINGS:', JSON.stringify(settings, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
