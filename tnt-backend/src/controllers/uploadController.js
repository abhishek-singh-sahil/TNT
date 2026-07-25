import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const localFilePath = req.file.path;

    // Check if Cloudinary is configured with real keys
    const isCloudinaryMock = 
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'tnt_cloud' ||
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === '1234567890';

    if (isCloudinaryMock) {
      console.log('Cloudinary credentials appear to be mock. Saving file locally instead.');
      const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        message: 'Uploaded successfully (Local storage fallback)',
        url: fileUrl,
      });
    }

    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'tnt_luxury',
      });

      // Delete the local file after successful upload to Cloudinary
      fs.unlinkSync(localFilePath);

      return res.json({
        success: true,
        message: 'Uploaded to Cloudinary successfully',
        url: result.secure_url,
      });
    } catch (cloudinaryErr) {
      console.warn('Cloudinary upload failed, falling back to local file URL:', cloudinaryErr.message);
      const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        message: 'Uploaded successfully (Local storage fallback)',
        url: fileUrl,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};
