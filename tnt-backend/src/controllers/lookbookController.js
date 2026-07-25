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
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: lookbooks.length, lookbooks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lookbooks', error: error.message });
  }
};
