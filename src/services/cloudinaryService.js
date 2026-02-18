import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import multerStorageCloudinary from 'multer-storage-cloudinary';
import env from '../config/env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Create storage engine for profile photos
const profilePhotoStorage = multerStorageCloudinary({
  cloudinary: cloudinary,
  params: {
    folder: 'campus-dating/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Create storage engine for college ID cards
const collegeIdStorage = multerStorageCloudinary({
  cloudinary: cloudinary,
  params: {
    folder: 'campus-dating/college-ids',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ quality: 'auto' }],
  },
});

// Create storage engine for chat media
const chatMediaStorage = multerStorageCloudinary({
  cloudinary: cloudinary,
  params: {
    folder: 'campus-dating/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg'],
    resource_type: 'auto',
  },
});

// Multer upload instances
export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadCollegeId = multer({
  storage: collegeIdStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadChatMedia = multer({
  storage: chatMediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload image from base64 or URL
export const uploadFromBase64 = async (base64String, folder) => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder || 'campus-dating/misc',
      resource_type: 'auto',
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Get signed URL for private content (college ID card)
export const getSignedUrl = async (publicId, expiresIn = 3600) => {
  try {
    const result = cloudinary.url(publicId, {
      sign: true,
      expires: Math.round(Date.now() / 1000) + expiresIn,
      secure: true,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary signed URL error:', error);
    return null;
  }
};

export default {
  cloudinary,
  uploadProfilePhoto,
  uploadCollegeId,
  uploadChatMedia,
  uploadFromBase64,
  deleteImage,
  getSignedUrl,
};
