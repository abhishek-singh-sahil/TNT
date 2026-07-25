import { prisma } from '../config/prisma.js';

/**
 * Resolves active sales discounts for a list of products or a single product.
 * Returns the products with attached finalPrice, discountPercentage, saleBadge, etc.
 */
export async function resolveProductDiscounts(productsOrProduct) {
  if (!productsOrProduct) return productsOrProduct;

  const isArray = Array.isArray(productsOrProduct);
  const products = isArray ? productsOrProduct : [productsOrProduct];

  try {
    const now = new Date();
    // Fetch all active sale campaigns
    const activeCampaigns = await prisma.saleCampaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        products: { select: { id: true } },
        categories: { select: { id: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { salePercentage: 'desc' }
      ]
    });

    // If no active campaigns, set defaults
    if (activeCampaigns.length === 0) {
      products.forEach(p => {
        p.saleCampaign = null;
        p.finalPrice = p.basePrice;
        p.discountPercentage = 0;
      });
      return isArray ? products : products[0];
    }

    // For each product, find the best matching campaign
    for (const p of products) {
      let bestCampaign = null;
      let highestDiscount = 0;

      // Ensure we have product categories loaded if needed
      let productCategoryIds = [];
      if (p.categories) {
        productCategoryIds = p.categories.map(c => c.id);
      } else {
        // lazy load categories if not included in query
        const dbProd = await prisma.product.findUnique({
          where: { id: p.id },
          select: { categories: { select: { id: true } } }
        });
        if (dbProd && dbProd.categories) {
          productCategoryIds = dbProd.categories.map(c => c.id);
        }
      }

      for (const campaign of activeCampaigns) {
        let isApplicable = false;

        if (campaign.campaignType === 'STORE') {
          isApplicable = true;
        } else if (campaign.campaignType === 'PRODUCT') {
          isApplicable = campaign.products.some(cp => cp.id === p.id);
        } else if (campaign.campaignType === 'CATEGORY') {
          isApplicable = campaign.categories.some(cc => productCategoryIds.includes(cc.id));
        }

        if (isApplicable) {
          if (campaign.salePercentage > highestDiscount) {
            highestDiscount = campaign.salePercentage;
            bestCampaign = campaign;
          }
        }
      }

      if (bestCampaign) {
        p.saleCampaign = {
          id: bestCampaign.id,
          name: bestCampaign.name,
          salePercentage: bestCampaign.salePercentage,
          bgColor: bestCampaign.bgColor,
          badgeColor: bestCampaign.badgeColor,
          badgeText: bestCampaign.badgeText
        };
        p.discountPercentage = bestCampaign.salePercentage;
        // round to nearest integer or keep float
        p.finalPrice = Math.round(p.basePrice * (1 - bestCampaign.salePercentage / 100));
      } else {
        p.saleCampaign = null;
        p.finalPrice = p.basePrice;
        p.discountPercentage = 0;
      }
    }
  } catch (error) {
    console.error('Failed to resolve product discounts:', error);
    products.forEach(p => {
      p.saleCampaign = null;
      p.finalPrice = p.basePrice;
      p.discountPercentage = 0;
    });
  }

  return isArray ? products : products[0];
}
