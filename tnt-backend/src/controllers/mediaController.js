import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';

const UPLOADS_DIR = 'uploads';

// Helper: sanitize filename to prevent path traversal
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/\.\.+/g, '.');
}

// Helper: format file size
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper for asset usage detection
async function detectAssetUsage(url) {
  const usages = [];
  if (!url) return usages;

  try {
    const productImages = await prisma.productImage.findMany({
      where: { url: { contains: url } },
      include: { product: { select: { name: true } } }
    });
    productImages.forEach(img => {
      usages.push({ type: 'Product', name: img.product?.name || 'Unnamed Product', id: img.productId });
    });

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

    const banners = await prisma.banner.findMany({
      where: { imageUrl: { contains: url } }
    });
    banners.forEach(b => {
      usages.push({ type: 'CMS Banner', name: b.title, id: b.id });
    });

    const collections = await prisma.collection.findMany({
      where: { bannerImage: { contains: url } }
    });
    collections.forEach(coll => {
      usages.push({ type: 'Collection', name: coll.name, id: coll.id });
    });

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

// 1. Cloudinary Sync bypass (legacy)
export const syncCloudinary = async (req, res) => {
  return res.json({
    success: true,
    message: 'VPS Local storage mode active. Syncing bypassed.',
    count: 0
  });
};

// 2. Get list of assets with pagination, search, sort, folder filter
export const getMediaAssets = async (req, res) => {
  try {
    const {
      search,
      fileType,
      folder,
      sort = 'newest',
      page = '1',
      limit = '24'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 24);
    const skip = (pageNum - 1) * limitNum;

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
        { publicId: { contains: search, mode: 'insensitive' } },
        { folder: { contains: search, mode: 'insensitive' } }
      ];
    }

    let orderBy;
    switch (sort) {
      case 'oldest':       orderBy = { createdAt: 'asc' };  break;
      case 'name_asc':     orderBy = { filename: 'asc' };   break;
      case 'name_desc':    orderBy = { filename: 'desc' };  break;
      case 'size_asc':     orderBy = { fileSize: 'asc' };   break;
      case 'size_desc':    orderBy = { fileSize: 'desc' };  break;
      default:             orderBy = { createdAt: 'desc' };
    }

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({ where, orderBy, skip, take: limitNum })
    ]);

    // Only compute usage for first batch (performance)
    const assetsWithUsage = await Promise.all(assets.map(async (asset) => {
      const usages = await detectAssetUsage(asset.url);
      return { ...asset, usageCount: usages.length, usedIn: usages };
    }));

    // Stats: folders list (distinct), file type counts, storage
    const folders = await prisma.mediaAsset.groupBy({
      by: ['folder'],
      _count: { id: true }
    });

    const typeCounts = await prisma.mediaAsset.groupBy({
      by: ['fileType'],
      _count: { id: true }
    });

    const storageSumResult = await prisma.mediaAsset.aggregate({
      _sum: { fileSize: true }
    });

    const totalStorage = storageSumResult._sum.fileSize || 0;
    const totalCount = await prisma.mediaAsset.count();

    return res.json({
      success: true,
      assets: assetsWithUsage,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        totalFiles: totalCount,
        totalStorage,
        folders: folders.map(f => ({
          name: f.folder || 'tnt',
          count: f._count.id
        })),
        typeCounts: typeCounts.map(t => ({
          type: t.fileType,
          count: t._count.id
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch media assets', error: error.message });
  }
};

// 3. Get stats only (lightweight, for dashboard cards)
export const getMediaStats = async (req, res) => {
  try {
    const totalFiles = await prisma.mediaAsset.count();

    const storageSumResult = await prisma.mediaAsset.aggregate({
      _sum: { fileSize: true }
    });
    const totalStorage = storageSumResult._sum.fileSize || 0;

    const folders = await prisma.mediaAsset.groupBy({
      by: ['folder'],
      _count: { id: true }
    });

    const typeCounts = await prisma.mediaAsset.groupBy({
      by: ['fileType'],
      _count: { id: true }
    });

    return res.json({
      success: true,
      stats: {
        totalFiles,
        totalStorage,
        folderCount: folders.length,
        folders: folders.map(f => ({ name: f.folder || 'tnt', count: f._count.id })),
        typeCounts: typeCounts.map(t => ({ type: t.fileType, count: t._count.id }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};

// 4. Get single asset detail
export const getMediaAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const usages = await detectAssetUsage(asset.url);
    return res.json({
      success: true,
      asset: { ...asset, usageCount: usages.length, usedIn: usages }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch asset', error: error.message });
  }
};

// 5. Upload new file to VPS disk and register in DB
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = sanitizeFilename(req.body.folder || 'tnt');

    // Generate safe unique filename preserving original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const safeBase = sanitizeFilename(path.basename(req.file.originalname, originalExt));
    const filename = `${safeBase}-${uniqueSuffix}${originalExt}`;

    // Ensure uploads dir exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const localFilePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(localFilePath, req.file.buffer);

    // Domain-independent URL (relative path)
    const fileUrl = `/uploads/${filename}`;

    // Detect MIME file type category
    const mimeType = req.file.mimetype || '';
    let fileType = 'image';
    if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) fileType = 'document';
    else fileType = 'other';

    const asset = await prisma.mediaAsset.create({
      data: {
        publicId: filename,
        url: fileUrl,
        filename: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        width: null,
        height: null,
        folder
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully to VPS storage',
      asset: { ...asset, usageCount: 0, usedIn: [] }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to upload asset', error: error.message });
  }
};

// 6. Update asset metadata (rename display name, change folder, alt text)
export const updateMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, folder, altText } = req.body;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const updateData = {};
    if (filename && typeof filename === 'string') {
      updateData.filename = filename.trim().substring(0, 255);
    }
    if (folder && typeof folder === 'string') {
      updateData.folder = sanitizeFilename(folder.trim());
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, message: 'Asset updated successfully', asset: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update asset', error: error.message });
  }
};

// 7. Rename file (display name only - does NOT rename physical file to avoid breaking references)
export const renameMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { newFilename } = req.body;

    if (!newFilename || !newFilename.trim()) {
      return res.status(400).json({ success: false, message: 'New filename is required' });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { filename: newFilename.trim().substring(0, 255) }
    });

    return res.json({ success: true, message: 'Asset renamed successfully', asset: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to rename asset', error: error.message });
  }
};

// 8. Move asset to a different folder (updates DB metadata only - no physical file move needed)
export const moveMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder } = req.body;

    if (!folder || !folder.trim()) {
      return res.status(400).json({ success: false, message: 'Target folder is required' });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { folder: sanitizeFilename(folder.trim()) }
    });

    return res.json({ success: true, message: 'Asset moved successfully', asset: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to move asset', error: error.message });
  }
};

// 9. Delete single asset from VPS + DB
export const deleteMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceDelete } = req.body;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const usages = await detectAssetUsage(asset.url);
    if (usages.length > 0 && !forceDelete) {
      return res.status(400).json({
        success: false,
        isUsed: true,
        message: `This asset is used in ${usages.length} location(s).`,
        usages
      });
    }

    // Delete physical file from VPS
    const localFilePath = path.join(UPLOADS_DIR, asset.publicId);
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) { console.error('File delete error:', e); }
    }

    await prisma.mediaAsset.delete({ where: { id } });

    return res.json({ success: true, message: 'Asset deleted successfully from VPS storage.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete asset', error: error.message });
  }
};

// 10. Bulk delete
export const bulkDeleteMediaAssets = async (req, res) => {
  try {
    const { ids, forceDelete } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No asset IDs provided' });
    }

    const results = { deleted: [], failed: [], usageWarnings: [] };

    for (const id of ids) {
      const asset = await prisma.mediaAsset.findUnique({ where: { id } });
      if (!asset) { results.failed.push({ id, reason: 'Not found' }); continue; }

      const usages = await detectAssetUsage(asset.url);
      if (usages.length > 0 && !forceDelete) {
        results.usageWarnings.push({ id, filename: asset.filename, usages });
        continue;
      }

      try {
        const localFilePath = path.join(UPLOADS_DIR, asset.publicId);
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        await prisma.mediaAsset.delete({ where: { id } });
        results.deleted.push(id);
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    return res.json({
      success: true,
      message: `Deleted ${results.deleted.length} of ${ids.length} assets.`,
      results
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Bulk delete failed', error: error.message });
  }
};

// 11. Download asset - serve the file securely through the API
export const downloadMediaAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const localFilePath = path.join(UPLOADS_DIR, asset.publicId);
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${asset.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.sendFile(path.resolve(localFilePath));
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Download failed', error: error.message });
  }
};

// 12. Get all distinct folder names
export const getMediaFolders = async (req, res) => {
  try {
    const folders = await prisma.mediaAsset.groupBy({
      by: ['folder'],
      _count: { id: true },
      orderBy: { folder: 'asc' }
    });

    return res.json({
      success: true,
      folders: folders.map(f => ({
        name: f.folder || 'tnt',
        count: f._count.id
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch folders', error: error.message });
  }
};
