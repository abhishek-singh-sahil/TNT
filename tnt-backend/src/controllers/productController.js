import { prisma } from '../config/prisma.js';
import { resolveProductDiscounts } from '../utils/discountResolver.js';

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      collection,
      search,
      sort = 'newest',
      minPrice,
      maxPrice,
      color,
      size,
      gender, // 'men' or 'women'
      isNewArrival,
      onSale,
      page = 1,
      limit = 12,
    } = req.query;

    const where = { deletedAt: null };

    if (onSale === 'true' || onSale === true) {
      const now = new Date();
      const activeSales = await prisma.saleCampaign.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: {
          products: { select: { id: true } },
          categories: { include: { products: { select: { id: true } } } }
        }
      });

      const eligibleProductIds = new Set();
      activeSales.forEach(sale => {
        if (sale.campaignType === 'STORE') {
          // everything is eligible
        } else if (sale.campaignType === 'CATEGORY') {
          sale.categories.forEach(cat => {
            cat.products.forEach(p => eligibleProductIds.add(p.id));
          });
        } else {
          sale.products.forEach(p => eligibleProductIds.add(p.id));
        }
      });

      const isStoreWide = activeSales.some(s => s.campaignType === 'STORE');
      if (!isStoreWide) {
        where.id = { in: Array.from(eligibleProductIds) };
      }
    }

    if (isNewArrival === 'true' || isNewArrival === true) {
      where.isNewArrival = true;
    }

    if (category) {
      const categorySlugs = typeof category === 'string' ? category.split(',') : Array.isArray(category) ? category : [category];
      where.categories = {
        some: {
          slug: { in: categorySlugs }
        }
      };
    }

    if (collection) {
      where.collection = { slug: collection };
    }

    if (gender) {
      const genderList = typeof gender === 'string' ? gender.split(',') : Array.isArray(gender) ? gender : [gender];
      const genderConditions = [];
      if (genderList.includes('men')) {
        genderConditions.push({ genderMen: true });
      }
      if (genderList.includes('women')) {
        genderConditions.push({ genderWomen: true });
      }
      if (genderList.includes('accessories')) {
        genderConditions.push({ isAccessories: true });
      }
      if (genderList.includes('unisex')) {
        genderConditions.push({ genderMen: true, genderWomen: true });
      }
      if (genderConditions.length > 0) {
        // If there's already an OR condition (like from search), combine them
        if (where.OR) {
          where.AND = [
            { OR: where.OR },
            { OR: genderConditions }
          ];
          delete where.OR;
        } else {
          where.OR = genderConditions;
        }
      }
    }

    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        where.OR = tokens.flatMap(token => [
          { name: { contains: token, mode: 'insensitive' } },
          { description: { contains: token, mode: 'insensitive' } },
          { sku: { contains: token, mode: 'insensitive' } },
          {
            categories: {
              some: {
                OR: [
                  { name: { contains: token, mode: 'insensitive' } },
                  { slug: { contains: token, mode: 'insensitive' } }
                ]
              }
            }
          },
          {
            variants: {
              some: {
                OR: [
                  { color: { name: { contains: token, mode: 'insensitive' } } },
                  { size: { name: { contains: token, mode: 'insensitive' } } }
                ]
              }
            }
          }
        ]);
      }
    }

    if (color || size) {
      const variantFilter = {};
      if (color) {
        variantFilter.color = { name: { equals: color, mode: 'insensitive' } };
      }
      if (size) {
        variantFilter.size = { name: { equals: size, mode: 'insensitive' } };
      }
      where.variants = {
        some: variantFilter
      };
    }

    if (minPrice || maxPrice) {
      where.basePrice = {
        gte: minPrice ? parseFloat(minPrice) : 0,
        lte: maxPrice ? parseFloat(maxPrice) : 100000,
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-low') orderBy = { basePrice: 'asc' };
    if (sort === 'price-high') orderBy = { basePrice: 'desc' };
    if (sort === 'rating') orderBy = { rating: 'desc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          categories: true,
          images: { orderBy: { position: 'asc' } },
          variants: { include: { color: true, size: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithSales = await resolveProductDiscounts(products);

    return res.json({
      success: true,
      products: productsWithSales,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        categories: true,
        collection: true,
        images: { orderBy: { position: 'asc' } },
        videos: true,
        variants: { include: { color: true, size: true, inventory: true } },
        attributes: true,
        reviews: {
          where: { status: 'PUBLISHED' },
          include: { user: { select: { firstName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productWithSale = await resolveProductDiscounts(product);

    const seo = await prisma.sEO.findUnique({
      where: { page: `product-${product.id}` }
    });

    return res.json({
      success: true,
      product: {
        ...productWithSale,
        seoTitle: seo?.title || '',
        seoDescription: seo?.description || '',
        seoKeywords: seo?.keywords || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      basePrice,
      discountPrice,
      fit,
      washCare,
      isFeatured = false,
      isNewArrival = true,
      isBestSeller = false,
      isLimited = false,
      categoryIds = [],
      genderMen = false,
      genderWomen = false,
      isAccessories = false,
      collectionId = null,
      images = [],
      variants = []
    } = req.body;

    if (!name || !sku || !basePrice) {
      return res.status(400).json({ success: false, message: 'Missing required product fields' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: description || name,
        fit: fit || 'Oversized Fit',
        washCare: washCare || 'Machine wash cold with like colors',
        basePrice: parseFloat(basePrice),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        isFeatured,
        isNewArrival,
        isBestSeller,
        isLimited,
        genderMen,
        genderWomen,
        isAccessories,
        collectionId: collectionId || null,
        categories: categoryIds.length > 0 ? {
          connect: categoryIds.map(id => ({ id }))
        } : undefined,
        images: images.length > 0 ? {
          create: images.map((url, idx) => ({
            url,
            position: idx,
            isPrimary: idx === 0
          }))
        } : undefined,
        variants: variants.length > 0 ? {
          create: variants.map(v => ({
            sku: v.sku || `${sku}-${v.colorName || 'COL'}-${v.sizeName}`,
            price: parseFloat(v.price || basePrice),
            stock: parseInt(v.stock || 50),
            color: v.colorId ? { connect: { id: v.colorId } } : {
              connectOrCreate: {
                where: { name: v.colorName },
                create: { name: v.colorName, hexCode: v.colorHex || '#ccc' }
              }
            },
            size: {
              connectOrCreate: {
                where: { name: v.sizeName },
                create: { name: v.sizeName, code: v.sizeName }
              }
            }
          }))
        } : undefined
      },
      include: {
        categories: true,
        images: true,
        variants: { include: { color: true, size: true } }
      }
    });

    const { seoTitle, seoDescription, seoKeywords } = req.body;
    if (seoTitle || seoDescription) {
      await prisma.sEO.upsert({
        where: { page: `product-${product.id}` },
        update: {
          title: seoTitle || name,
          description: seoDescription || description || name,
          keywords: seoKeywords || ''
        },
        create: {
          page: `product-${product.id}`,
          title: seoTitle || name,
          description: seoDescription || description || name,
          keywords: seoKeywords || ''
        }
      });
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, message: 'Product deleted from database successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

// Colors and Sizes fetchers
export const getColors = async (req, res) => {
  try {
    const colors = await prisma.color.findMany();
    return res.json({ success: true, colors });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch colors', error: error.message });
  }
};

export const getSizes = async (req, res) => {
  try {
    const sizes = await prisma.size.findMany();
    return res.json({ success: true, sizes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sizes', error: error.message });
  }
};

export const createColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;
    if (!name || !hexCode) {
      return res.status(400).json({ success: false, message: 'Name and hexCode are required' });
    }
    const color = await prisma.color.upsert({
      where: { name },
      update: { hexCode },
      create: { name, hexCode }
    });
    return res.status(201).json({ success: true, color });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create color', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      basePrice,
      discountPrice,
      fit,
      washCare,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isLimited,
      categoryIds,
      genderMen,
      genderWomen,
      isAccessories,
      collectionId,
      images,
      variants
    } = req.body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }

    if (variants) {
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: id },
        include: { color: true, size: true }
      });

      for (const v of variants) {
        let targetColorId = v.colorId;
        if (!targetColorId && v.colorName) {
          const colRecord = await prisma.color.upsert({
            where: { name: v.colorName },
            update: {},
            create: { name: v.colorName, hexCode: v.colorHex || '#ccc' }
          });
          targetColorId = colRecord.id;
        }

        const sizeRecord = await prisma.size.upsert({
          where: { name: v.sizeName },
          update: {},
          create: { name: v.sizeName, code: v.sizeName }
        });
        const targetSizeId = sizeRecord.id;

        const existing = existingVariants.find(
          ev => ev.colorId === targetColorId && ev.sizeId === targetSizeId
        );

        if (existing) {
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: {
              sku: v.sku || existing.sku,
              price: parseFloat(v.price || basePrice || existing.price),
              stock: parseInt(v.stock !== undefined ? v.stock : existing.stock)
            }
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: id,
              sku: v.sku || `${sku || 'SKU'}-${v.colorName || 'COL'}-${v.sizeName}`,
              price: parseFloat(v.price || basePrice || 0),
              stock: parseInt(v.stock || 50),
              colorId: targetColorId,
              sizeId: targetSizeId
            }
          });
        }
      }

      const incomingCombos = [];
      for (const v of variants) {
        let colorId = v.colorId;
        if (!colorId && v.colorName) {
          const col = await prisma.color.findUnique({ where: { name: v.colorName } });
          if (col) colorId = col.id;
        }
        const sz = await prisma.size.findUnique({ where: { name: v.sizeName } });
        if (sz && colorId) {
          incomingCombos.push({ colorId, sizeId: sz.id });
        }
      }

      const toDelete = existingVariants.filter(ev => 
        !incomingCombos.some(ic => ic.colorId === ev.colorId && ic.sizeId === ev.sizeId)
      );

      for (const td of toDelete) {
        try {
          await prisma.productVariant.delete({ where: { id: td.id } });
        } catch (delErr) {
          console.log(`Variant ${td.id} is in order item. Setting stock to 0.`);
          await prisma.productVariant.update({
            where: { id: td.id },
            data: { stock: 0 }
          });
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        sku,
        description,
        fit,
        washCare,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        isFeatured,
        isNewArrival,
        isBestSeller,
        isLimited,
        genderMen,
        genderWomen,
        isAccessories,
        collectionId: collectionId !== undefined ? (collectionId || null) : undefined,
        categories: categoryIds ? {
          set: [],
          connect: categoryIds.map(catId => ({ id: catId }))
        } : undefined,
        images: images && images.length > 0 ? {
          create: images.map((url, idx) => ({
            url,
            position: idx,
            isPrimary: idx === 0
          }))
        } : undefined
      },
      include: {
        categories: true,
        images: true,
        variants: { include: { color: true, size: true } }
      }
    });

    const { seoTitle, seoDescription, seoKeywords } = req.body;
    if (seoTitle !== undefined || seoDescription !== undefined) {
      await prisma.sEO.upsert({
        where: { page: `product-${product.id}` },
        update: {
          title: seoTitle || name || product.name,
          description: seoDescription || description || product.description || product.name,
          keywords: seoKeywords || ''
        },
        create: {
          page: `product-${product.id}`,
          title: seoTitle || name || product.name,
          description: seoDescription || description || product.description || product.name,
          keywords: seoKeywords || ''
        }
      });
    }

    return res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' }
    });
    return res.json({ success: true, collections });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch collections', error: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        bannerImage: imageUrl || null
      }
    });
    return res.status(201).json({ success: true, message: 'Collection created successfully', collection });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create collection', error: error.message });
  }
};

export const getCategoriesPublic = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};



