// Prisma Seed script for TNT E-Commerce - Seeding Dynamic CMS & Test Data

import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TNT E-Commerce CMS and dynamic database records...');

  // 1. System Roles
  const rolesList = [
    { name: 'SUPER_ADMIN', desc: 'Super Administrator' },
    { name: 'ADMIN', desc: 'Administrator' },
    { name: 'CUSTOMER', desc: 'Standard Customer Account' },
    { name: 'MANAGER', desc: 'Store & Operations Manager' },
    { name: 'SUPPORT', desc: 'Customer Support Agent' },
  ];

  const roleMap = {};
  for (const r of rolesList) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, description: r.desc },
    });
    roleMap[r.name] = roleRecord.id;
  }

  // 2. Initial Administrative Accounts
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@tntclothing.com' },
    update: {},
    create: {
      firstName: 'TNT',
      lastName: 'Super Admin',
      email: 'admin@tntclothing.com',
      phone: '+91 99999 88888',
      passwordHash: adminPassword,
      isVerified: true,
      roleId: roleMap['SUPER_ADMIN'],
    },
  });

  // 3. Test Customer Account ("Akhtar Raza")
  const customerPassword = await bcrypt.hash('user123', 10);
  const customerUser = await prisma.user.upsert({
    where: { email: 'akhtar@example.com' },
    update: {},
    create: {
      firstName: 'Akhtar',
      lastName: 'Raza',
      email: 'akhtar@example.com',
      phone: '+91 98765 43210',
      passwordHash: customerPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      isVerified: true,
      rewardPoints: 320,
      rewardTier: 'Silver Tier',
      roleId: roleMap['CUSTOMER'],
    },
  });

  // 4. Default Address for Customer
  const homeAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      type: 'Home',
      fullName: 'Akhtar Raza',
      phone: '+91 98765 43210',
      street: '23, Park Street, Civil Lines',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208001',
      country: 'India',
      isDefault: true,
    },
  });

  // 5. Default Announcement Bar Configuration
  await prisma.announcement.upsert({
    where: { id: 'default-announcement' },
    update: { message: 'FREE SHIPPING ON ORDERS ABOVE ₹1999 | COD AVAILABLE', isActive: true },
    create: {
      id: 'default-announcement',
      message: 'FREE SHIPPING ON ORDERS ABOVE ₹1999 | COD AVAILABLE',
      isActive: true,
    },
  });

  // 6. Seed Product Categories with showOnHomepage flag
  const catOversized = await prisma.category.upsert({
    where: { slug: 'oversized' },
    update: { showOnHomepage: true, displayOrder: 1, homepageImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' },
    create: { name: 'Oversized', slug: 'oversized', description: 'Oversized luxury drop-shoulder drops.', showOnHomepage: true, displayOrder: 1, homepageImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' },
  });

  const catHoodies = await prisma.category.upsert({
    where: { slug: 'hoodies' },
    update: { showOnHomepage: true, displayOrder: 2, homepageImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800' },
    create: { name: 'Hoodies', slug: 'hoodies', description: 'Luxury heavy hoodies.', showOnHomepage: true, displayOrder: 2, homepageImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800' },
  });

  const catTshirts = await prisma.category.upsert({
    where: { slug: 't-shirts' },
    update: { showOnHomepage: true, displayOrder: 3, homepageImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800' },
    create: { name: 'T-Shirts', slug: 't-shirts', description: 'Street graphic tees.', showOnHomepage: true, displayOrder: 3, homepageImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800' },
  });

  // 7. Seed Colors and Sizes
  const blackColor = await prisma.color.upsert({ where: { name: 'Jet Black' }, update: {}, create: { name: 'Jet Black', hexCode: '#000000' } });
  const sizeM = await prisma.size.upsert({ where: { name: 'M' }, update: {}, create: { name: 'M', code: 'M' } });

  // 8. Seed Products
  const prod1 = await prisma.product.upsert({
    where: { slug: 'oversized-minimal-tee' },
    update: { isFeatured: true },
    create: {
      name: 'Oversized Minimal Tee',
      slug: 'oversized-minimal-tee',
      sku: 'TNT-TEE-001',
      description: 'Heavyweight organic combed cotton tee.',
      basePrice: 1499,
      categories: {
        connect: { id: catOversized.id }
      },
      isFeatured: true,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', isPrimary: true },
        ],
      },
      variants: {
        create: [
          { colorId: blackColor.id, sizeId: sizeM.id, sku: 'TNT-TEE-BLK-M', price: 1499, stock: 75 },
        ],
      },
    },
  });

  // 9. Trust Features
  await prisma.trustFeature.deleteMany();
  await prisma.trustFeature.createMany({
    data: [
      { icon: 'Truck', title: 'FREE SHIPPING', subtitle: 'On orders above ₹1999', order: 1 },
      { icon: 'ShieldCheck', title: 'PREMIUM QUALITY', subtitle: 'Heavyweight, durable garments', order: 2 },
      { icon: 'RotateCcw', title: 'EASY RETURNS', subtitle: '14-day hassle-free return window', order: 3 },
      { icon: 'CreditCard', title: 'SECURE PAYMENTS', subtitle: '100% encrypted checkout', order: 4 },
      { icon: 'HelpCircle', title: 'CUSTOMER SUPPORT', subtitle: 'Direct hotline & live chat help', order: 5 },
    ]
  });

  // 10. Hero Banners
  await prisma.banner.deleteMany();
  await prisma.banner.create({
    data: {
      title: 'DEFINE YOUR EDGE.',
      subtitle: 'NEW COLLECTION',
      imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600',
      buttonText: 'SHOP COLLECTION',
      link: '/products',
      isActive: true,
      position: 1
    }
  });

  // 11. Promotional Cards
  await prisma.homepagePromotion.deleteMany();
  await prisma.homepagePromotion.createMany({
    data: [
      { title: "SUMMER '24 COLLECTION", subtitle: "NEW DROP", imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600", buttonText: "SHOP NOW", buttonUrl: "/products", order: 1 },
      { title: "GET 10% OFF", subtitle: "ON YOUR FIRST ORDER", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", buttonText: "USE CODE: WELCOME10", buttonUrl: "/products", couponCode: "WELCOME10", order: 2 },
      { title: "BUNDLE & SAVE", subtitle: "BUY MORE PAY LESS", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600", buttonText: "SHOP COLLECTION", buttonUrl: "/products", order: 3 }
    ]
  });

  // 12. Brand Story
  await prisma.homepageBrandStory.deleteMany();
  await prisma.homepageBrandStory.create({
    data: {
      heading: "BUILT DIFFERENT. MADE FOR EVERYONE.",
      description: "TNT was born from a simple idea - create streetwear clothing that speaks confidence, comfort, and individuality. Engineered with luxury heavyweight fabrics, every detail is crafted to be your everyday statement.",
      imageUrl: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=1200",
      buttonText: "LEARN MORE ABOUT US",
      buttonUrl: "/about"
    }
  });

  // 13. Instagram Gallery
  await prisma.instagramGallery.deleteMany();
  await prisma.instagramGallery.createMany({
    data: [
      { imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400", caption: "Tone up your style", link: "https://instagram.com", order: 1 },
      { imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400", caption: "Minimal details", link: "https://instagram.com", order: 2 },
      { imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400", caption: "Premium heavy cotton fit", link: "https://instagram.com", order: 3 },
      { imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400", caption: "Essential wear", link: "https://instagram.com", order: 4 },
      { imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400", caption: "Classic drops", link: "https://instagram.com", order: 5 }
    ]
  });

  // 14. Why Choose Us
  await prisma.whyChooseUs.deleteMany();
  await prisma.whyChooseUs.createMany({
    data: [
      { icon: 'Shirt', title: '240 GSM PREMIUM COTTON', subtitle: 'Soft, breathable & durable', order: 1 },
      { icon: 'Smile', title: 'OVERSIZED PERFECT FIT', subtitle: 'Designed for comfort & style', order: 2 },
      { icon: 'RefreshCw', title: 'FADE & SHRINK RESISTANT', subtitle: 'Built to last wash after wash', order: 3 },
      { icon: 'MapPin', title: 'MADE IN INDIA', subtitle: 'Proudly designed & made locally', order: 4 },
      { icon: 'Users', title: 'TRUSTED BY 12,000+', subtitle: 'Happy customers across India', order: 5 }
    ]
  });

  console.log('✅ Seeding dynamic CMS content completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
