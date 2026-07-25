import { prisma } from '../config/prisma.js';
import { resolveProductDiscounts } from '../utils/discountResolver.js';

export const getHomepageData = async (req, res) => {
  try {
    const [
      banners,
      announcement,
      trustFeatures,
      promotions,
      brandStory,
      reviews,
      instagramPics,
      whyChooseUs,
      categories,
      products
    ] = await Promise.all([
      // 1. Hero Banners
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
      // 2. Announcement
      prisma.announcement.findFirst({ where: { isActive: true } }),
      // 3. Trust Features
      prisma.trustFeature.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
      // 4. Promotional Cards
      prisma.homepagePromotion.findMany({ where: { visible: true }, orderBy: { order: 'asc' }, take: 3 }),
      // 5. Brand Story
      prisma.homepageBrandStory.findFirst({ where: { visible: true } }),
      // 6. Real Verified Testimonials / Reviews (rating >= 4)
      prisma.review.findMany({
        where: { rating: { gte: 4 } },
        take: 4,
        include: { user: { select: { firstName: true, email: true } }, product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      // 7. Instagram feed
      prisma.instagramGallery.findMany({ where: { visible: true }, orderBy: { order: 'asc' }, take: 6 }),
      // 8. Why Choose Us
      prisma.whyChooseUs.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
      // 9. Categories to show on Homepage
      prisma.category.findMany({
        where: { showOnHomepage: true },
        orderBy: { displayOrder: 'asc' }
      }),
      // 10. New Arrivals (Products)
      prisma.product.findMany({
        where: { isNewArrival: true, deletedAt: null },
        take: 24, // Let's fetch up to 24 new arrivals for slider as requested by user!
        include: { images: true, categories: true, variants: { include: { color: true, size: true } } },
      })
    ]);

    return res.json({
      success: true,
      data: {
        heroSlides: banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || '',
          image: b.imageUrl,
          buttonText: b.buttonText || 'SHOP NOW',
          link: b.link || '/products',
        })),
        announcement: announcement?.message || '',
        trustFeatures,
        promotions,
        brandStory: brandStory || {
          heading: "BUILT DIFFERENT. MADE FOR EVERYONE.",
          description: "TNT was born from a simple idea - create clothing that speaks confidence, comfort, and individuality.",
          imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200",
          buttonText: "LEARN MORE ABOUT US",
          buttonUrl: "/about"
        },
        reviews: reviews.map(r => ({
          id: r.id,
          name: r.user?.firstName || 'Anonymous',
          rating: r.rating,
          content: r.comment,
          product: r.product?.name
        })),
        instagramPics,
        whyChooseUs,
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.homepageImage || c.cardImage || c.bannerImage || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400'
        })),
        newArrivals: await resolveProductDiscounts(products)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch homepage data', error: error.message });
  }
};

export const updateHomepageCMS = async (req, res) => {
  try {
    const {
      announcementMessage,
      heroSlide,
      trustFeature,
      promotion,
      brandStory,
      instagramPic,
      whyChooseUsItem
    } = req.body;

    if (announcementMessage) {
      await prisma.announcement.upsert({
        where: { id: 'default-announcement' },
        update: { message: announcementMessage, isActive: true },
        create: { id: 'default-announcement', message: announcementMessage, isActive: true },
      });
    }

    if (heroSlide) {
      if (heroSlide.id) {
        await prisma.banner.update({
          where: { id: heroSlide.id },
          data: {
            title: heroSlide.title,
            subtitle: heroSlide.subtitle,
            imageUrl: heroSlide.image,
            buttonText: heroSlide.buttonText || 'SHOP NOW',
            link: heroSlide.link || '/products',
            isActive: true,
          }
        });
      } else {
        await prisma.banner.create({
          data: {
            title: heroSlide.title,
            subtitle: heroSlide.subtitle,
            imageUrl: heroSlide.image,
            buttonText: heroSlide.buttonText || 'SHOP NOW',
            link: heroSlide.link || '/products',
            isActive: true,
          },
        });
      }
    }

    if (trustFeature) {
      if (trustFeature.id) {
        await prisma.trustFeature.update({
          where: { id: trustFeature.id },
          data: {
            icon: trustFeature.icon,
            title: trustFeature.title,
            subtitle: trustFeature.subtitle,
            order: parseInt(trustFeature.order || '0')
          }
        });
      } else {
        await prisma.trustFeature.create({
          data: {
            icon: trustFeature.icon,
            title: trustFeature.title,
            subtitle: trustFeature.subtitle,
            order: parseInt(trustFeature.order || '0')
          }
        });
      }
    }

    if (promotion) {
      if (promotion.id) {
        await prisma.homepagePromotion.update({
          where: { id: promotion.id },
          data: {
            title: promotion.title,
            subtitle: promotion.subtitle,
            imageUrl: promotion.imageUrl,
            buttonText: promotion.buttonText,
            buttonUrl: promotion.buttonUrl,
            couponCode: promotion.couponCode,
            order: parseInt(promotion.order || '0')
          }
        });
      } else {
        await prisma.homepagePromotion.create({
          data: {
            title: promotion.title,
            subtitle: promotion.subtitle,
            imageUrl: promotion.imageUrl,
            buttonText: promotion.buttonText,
            buttonUrl: promotion.buttonUrl,
            couponCode: promotion.couponCode,
            order: parseInt(promotion.order || '0')
          }
        });
      }
    }

    if (brandStory) {
      const existing = await prisma.homepageBrandStory.findFirst();
      if (existing) {
        await prisma.homepageBrandStory.update({
          where: { id: existing.id },
          data: {
            heading: brandStory.heading,
            description: brandStory.description,
            imageUrl: brandStory.imageUrl,
            buttonText: brandStory.buttonText,
            buttonUrl: brandStory.buttonUrl
          }
        });
      } else {
        await prisma.homepageBrandStory.create({
          data: {
            heading: brandStory.heading,
            description: brandStory.description,
            imageUrl: brandStory.imageUrl,
            buttonText: brandStory.buttonText,
            buttonUrl: brandStory.buttonUrl
          }
        });
      }
    }

    if (instagramPic) {
      if (instagramPic.id) {
        await prisma.instagramGallery.update({
          where: { id: instagramPic.id },
          data: {
            imageUrl: instagramPic.imageUrl,
            caption: instagramPic.caption,
            link: instagramPic.link,
            order: parseInt(instagramPic.order || '0')
          }
        });
      } else {
        await prisma.instagramGallery.create({
          data: {
            imageUrl: instagramPic.imageUrl,
            caption: instagramPic.caption,
            link: instagramPic.link,
            order: parseInt(instagramPic.order || '0')
          }
        });
      }
    }

    if (whyChooseUsItem) {
      if (whyChooseUsItem.id) {
        await prisma.whyChooseUs.update({
          where: { id: whyChooseUsItem.id },
          data: {
            icon: whyChooseUsItem.icon,
            title: whyChooseUsItem.title,
            subtitle: whyChooseUsItem.subtitle,
            order: parseInt(whyChooseUsItem.order || '0')
          }
        });
      } else {
        await prisma.whyChooseUs.create({
          data: {
            icon: whyChooseUsItem.icon,
            title: whyChooseUsItem.title,
            subtitle: whyChooseUsItem.subtitle,
            order: parseInt(whyChooseUsItem.order || '0')
          }
        });
      }
    }


    return res.json({ success: true, message: 'Homepage CMS updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update homepage CMS', error: error.message });
  }
};

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return res.json({ success: true, message: 'You are already subscribed to our newsletter!' });
    }

    await prisma.newsletterSubscriber.create({ data: { email } });
    return res.json({ success: true, message: 'Successfully subscribed to the TNT Newsletter!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to subscribe', error: error.message });
  }
};

export const deleteHeroBannerAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    return res.json({ success: true, message: 'Hero banner deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete hero banner', error: error.message });
  }
};

export const deleteTrustFeatureAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.trustFeature.delete({ where: { id } });
    return res.json({ success: true, message: 'Trust feature deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete trust feature', error: error.message });
  }
};

export const deletePromotionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.homepagePromotion.delete({ where: { id } });
    return res.json({ success: true, message: 'Promotion card deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete promotion card', error: error.message });
  }
};

export const deleteInstagramPicAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.instagramGallery.delete({ where: { id } });
    return res.json({ success: true, message: 'Instagram gallery image deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete Instagram image', error: error.message });
  }
};

export const deleteWhyChooseUsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.whyChooseUs.delete({ where: { id } });
    return res.json({ success: true, message: 'Why Choose Us item deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete Why Choose Us item', error: error.message });
  }
};

