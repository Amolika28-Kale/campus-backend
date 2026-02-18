import jwt from 'jsonwebtoken';
import env from '../config/env.js';

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate tokens
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpire });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpire });
};

// Verify token
export const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken ? env.jwtRefreshSecret : env.jwtSecret;
  return jwt.verify(token, secret);
};

// Calculate age from date of birth
export const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Validate phone number format
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
};

// Paginate
export const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
  };
};

// Build pagination response
export const buildPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// Filter builder for discovery
export const buildDiscoveryFilters = (filters, userId) => {
  const query = {
    _id: { $ne: userId }, // Exclude current user
    verificationStatus: 'approved', // Only verified users
    isBanned: false,
  };

  if (filters.country) query.country = filters.country;
  if (filters.city) query.city = filters.city;
  if (filters.collegeId) query.collegeId = filters.collegeId;
  if (filters.gender) query.gender = filters.gender;

  // Age range filter
  if (filters.minAge || filters.maxAge) {
    query.dob = {};
    if (filters.minAge) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - filters.minAge);
      query.dob.$lte = maxDate;
    }
    if (filters.maxAge) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - filters.maxAge);
      query.dob.$gte = minDate;
    }
  }

  // Interests filter
  if (filters.interests && filters.interests.length > 0) {
    query.interests = { $in: filters.interests };
  }

  return query;
};

// Sanitize user data for response
export const sanitizeUser = (user, includePrivate = false) => {
  const sanitized = {
    id: user._id,
    phone: user.phone,
    name: user.name,
    gender: user.gender,
    dob: user.dob,
    age: user.age,
    bio: user.bio,
    interests: user.interests,
    photos: user.photos,
    country: user.country,
    city: user.city,
    collegeId: user.collegeId,
    course: user.course,
    year: user.year,
    verificationStatus: user.verificationStatus,
    isOnline: user.isOnline,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
  };

  // Include private fields only for self or admin
  if (includePrivate) {
    sanitized.collegeIdCard = user.collegeIdCard;
    sanitized.rejectionReason = user.rejectionReason;
    sanitized.isBanned = user.isBanned;
    sanitized.banReason = user.banReason;
    sanitized.role = user.role;
    sanitized.fcmToken = user.fcmToken;
  }

  return sanitized;
};

// Generate random string
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
