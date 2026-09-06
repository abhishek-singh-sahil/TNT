import { prisma } from '../config/prisma.js';

export const getLookbooks = async (req, res) => {
  try {
    const { category, productType, season, color } = req.query;

    const where = {};
    if (category && category !== 'All Looks') {
      where.category = category;
    }
    if (productType) {
      where.productType = productType;
    }
    if (season && season !== 'All Season') {
      where.season = season;
    }
    if (color) {
      where.colorName = color;
    }

    const lookbooks = await prisma.lookbook.findMany({
      where,
      include: {
        items: { include: { product: { include: { images: true } } } },
      },
      orderBy: { id: 'desc' },
    });

    return res.json({ success: true, count: lookbooks.length, lookbooks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lookbooks', error: error.message });
  }
};

export const createLookbook = async (req, res) => {
  try {
    const { title, subtitle, category, productType, season, colorName, coverImage, isFeatured = true, productIds = [] } = req.body;
    if (!title || !coverImage) {
      return res.status(400).json({ success: false, message: 'Title and Cover Image are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const lookbook = await prisma.lookbook.create({
      data: {
        title,
        slug,
        subtitle,
        category: category || 'All Looks',
        productType: productType || 'T-Shirts',
        season: season || 'Summer',
        colorName: colorName || 'Black',
        coverImage,
        isFeatured,
        items: productIds.length > 0 ? {
          create: productIds.map((pId, idx) => ({
            productId: pId,
            position: idx
          }))
        } : undefined
      },
      include: {
        items: { include: { product: true } }
      }
    });

    return res.status(201).json({ success: true, lookbook });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create lookbook', error: error.message });
  }
};

export const updateLookbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, category, productType, season, colorName, coverImage, isFeatured, productIds } = req.body;

    const existing = await prisma.lookbook.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lookbook entry not found' });
    }

    if (productIds && Array.isArray(productIds)) {
      await prisma.lookbookItem.deleteMany({ where: { lookbookId: id } });
    }

    const lookbook = await prisma.lookbook.update({
      where: { id },
      data: {
        title: title || undefined,
        subtitle: subtitle !== undefined ? subtitle : undefined,
        category: category || undefined,
        productType: productType || undefined,
        season: season || undefined,
        colorName: colorName || undefined,
        coverImage: coverImage || undefined,
        isFeatured: isFeatured !== undefined ? isFeatured : undefined,
        items: (productIds && Array.isArray(productIds)) ? {
          create: productIds.map((pId, idx) => ({
            productId: pId,
            position: idx
          }))
        } : undefined
      },
      include: { items: { include: { product: true } } }
    });

    return res.json({ success: true, lookbook });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update lookbook', error: error.message });
  }
};

export const deleteLookbook = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lookbook.delete({ where: { id } });
    return res.json({ success: true, message: 'Lookbook entry deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete lookbook', error: error.message });
  }
};
