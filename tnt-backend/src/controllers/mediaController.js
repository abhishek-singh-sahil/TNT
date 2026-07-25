import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../config/prisma.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper for asset usage detection
async function detectAssetUsage(url, publicId) {
  const usages = [];
  if (!url) return usages;

  try {
    // 1. Check ProductImage
    const productImages = await prisma.productImage.findMany({
      where: { url: { contains: url } },
      include: { product: { select: { name: true } } }
    });
    productImages.forEach(img => {
      usages.push({ type: 'Product', name: img.product?.name || 'Unnamed Product', id: img.productId });
    });

    // 2. Check Category
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { homepageImage: { contains: url } },
          { bannerImage: { contains: url } },
          { cardImage: { contains: url } }
        ]
      }
    });
    categories.forEach(cat => {
      usages.push({ type: 'Category', name: cat.name, id: cat.id });
    });

    // 3. Check Banner
    const banners = await prisma.banner.findMany({
      where: { imageUrl: { contains: url } }
    });
    banners.forEach(b => {
      usages.push({ type: 'CMS Banner', name: b.title, id: b.id });
    });

    // 4. Check Collection
    const collections = await prisma.collection.findMany({
      where: { bannerImage: { contains: url } }
    });
    collections.forEach(coll => {
      usages.push({ type: 'Collection', name: coll.name, id: coll.id });
    });

    // 5. Check Homepage Promotion
    const promos = await prisma.homepagePromotion.findMany({
      where: {
        OR: [
          { imageUrl: { contains: url } },
          { mobileImageUrl: { contains: url } }
        ]
      }
    });
    promos.forEach(p => {
      usages.push({ type: 'CMS Promotion', name: p.title, id: p.id });
    });

    // 6. Check Brand Story
    const stories = await prisma.homepageBrandStory.findMany({
      where: { imageUrl: { contains: url } }
    });
    stories.forEach(s => {
      usages.push({ type: 'CMS Brand Story', name: s.title, id: s.id });
    });
  } catch (err) {
    console.error('Usage detection failed:', err);
  }

  return usages;
}

// 1. Sync Cloudinary files with MediaAsset table
export const syncCloudinary = async (req, res) => {
  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: '',
      max_results: 500
    });

    const resources = response.resources || [];
    const syncedAssets = [];

    for (const resource of resources) {
      const asset = await prisma.mediaAsset.upsert({
        where: { publicId: resource.public_id },
        update: {
          url: resource.secure_url,
          filename: resource.public_id.split('/').pop() || resource.public_id,
          fileType: resource.resource_type,
          fileSize: resource.bytes,
          width: resource.width,
          height: resource.height,
          folder: resource.folder || 'tnt'
        },
        create: {
          publicId: resource.public_id,
          url: resource.secure_url,
          filename: resource.public_id.split('/').pop() || resource.public_id,
          fileType: resource.resource_type,
          fileSize: resource.bytes,
          width: resource.width,
          height: resource.height,
          folder: resource.folder || 'tnt'
        }
      });
      syncedAssets.push(asset);
    }

    return res.json({
      success: true,
      message: `Successfully synchronized ${syncedAssets.length} assets with Cloudinary!`,
      count: syncedAssets.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Cloudinary synchronization failed', error: error.message });
  }
};

// 2. Get list of assets from MediaAsset table
export const getMediaAssets = async (req, res) => {
  try {
    const { search, fileType, folder } = req.query;

    const where = {};
    if (fileType && fileType !== 'all') {
      where.fileType = fileType;
    }
    if (folder && folder !== 'all') {
      where.folder = folder;
    }
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { publicId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Append usage checks
    const assetsWithUsage = await Promise.all(assets.map(async (asset) => {
      const usages = await detectAssetUsage(asset.url, asset.publicId);
      return {
        ...asset,
        usageCount: usages.length,
        usedIn: usages
      };
    }));

    return res.json({ success: true, assets: assetsWithUsage });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch media assets', error: error.message });
  }
};

// 3. Upload new file directly to Cloudinary and register in database
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'tnt';

    // Upload buffer stream to Cloudinary
    const uploadStreamPromise = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const cloudinaryResult = await uploadStreamPromise(req.file.buffer);

    const asset = await prisma.mediaAsset.create({
      data: {
        publicId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        filename: req.file.originalname,
        fileType: cloudinaryResult.resource_type,
        fileSize: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        folder: folder
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully to Cloudinary',
      asset: {
        ...asset,
        usageCount: 0,
        usedIn: []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to upload asset', error: error.message });
  }
};

// 4. Delete image from Cloudinary and MediaAsset table
export const deleteMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceDelete } = req.body;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check usage
    const usages = await detectAssetUsage(asset.url, asset.publicId);
    if (usages.length > 0 && !forceDelete) {
      return res.status(400).json({
        success: false,
        isUsed: true,
        message: `This asset is currently in use in ${usages.length} locations.`,
        usages
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(asset.publicId);

    // Delete from DB
    await prisma.mediaAsset.delete({ where: { id } });

    return res.json({ success: true, message: 'Media asset permanently deleted from database and Cloudinary!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete asset', error: error.message });
  }
};

// 5. Rename file
export const renameMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { newFilename } = req.body;

    if (!newFilename) {
      return res.status(400).json({ success: false, message: 'New filename is required' });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Update in database (Cloudinary does not easily allow renaming the filename metadata without changing public_id, which breaks current URL links in DB)
    // Changing filename only in db maintains current image URLs and is highly recommended
    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { filename: newFilename }
    });

    return res.json({ success: true, message: 'Asset renamed successfully', asset: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to rename asset', error: error.message });
  }
};
