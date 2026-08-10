import fs from 'fs';
import path from 'path';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      message: 'Uploaded successfully to local VPS storage',
      url: fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to upload asset', error: error.message });
  }
};
