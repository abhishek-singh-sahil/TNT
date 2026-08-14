import { prisma } from '../config/prisma.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Automatically register this upload in the MediaAsset table for central visibility
    try {
      await prisma.mediaAsset.create({
        data: {
          publicId: req.file.filename,
          url: fileUrl,
          filename: req.file.originalname,
          fileType: req.file.mimetype.split('/')[0] || 'image',
          fileSize: req.file.size,
          width: null,
          height: null,
          folder: 'tnt'
        }
      });
    } catch (dbErr) {
      // Log DB error but don't crash upload response if registration fails
      console.error('Failed to register uploaded image in MediaAsset:', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Uploaded successfully to local VPS storage',
      url: fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to upload asset', error: error.message });
  }
};
