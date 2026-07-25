import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    console.log('Testing Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    });
    const res = await cloudinary.api.resources({
      type: 'upload',
      max_results: 10
    });
    console.log('Resources fetched successfully:', res.resources?.length);
  } catch (err) {
    console.error('Error fetching from Cloudinary:', err);
  }
}
run();
