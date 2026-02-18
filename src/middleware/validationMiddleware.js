import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Middleware to validate request using express-validator
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    
    throw ApiError.badRequest('Validation failed', errorMessages);
  }
  
  next();
};

// Common validation rules
export const phoneValidation = {
  phone: {
    notEmpty: {
      errorMessage: 'Phone number is required',
    },
    isMobilePhone: {
      options: 'any',
      errorMessage: 'Please provide a valid phone number',
    },
  },
};

export const otpValidation = {
  otp: {
    notEmpty: {
      errorMessage: 'OTP is required',
    },
    isLength: {
      options: { min: 6, max: 6 },
      errorMessage: 'OTP must be 6 digits',
    },
    isNumeric: {
      errorMessage: 'OTP must contain only numbers',
    },
  },
};

export const profileValidation = {
  name: {
    notEmpty: {
      errorMessage: 'Name is required',
    },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Name must be between 2 and 50 characters',
    },
    trim: true,
  },
  gender: {
    notEmpty: {
      errorMessage: 'Gender is required',
    },
    isIn: {
      options: [['male', 'female', 'other']],
      errorMessage: 'Gender must be male, female, or other',
    },
  },
  dob: {
    notEmpty: {
      errorMessage: 'Date of birth is required',
    },
    isISO8601: {
      errorMessage: 'Please provide a valid date',
    },
  },
  bio: {
    notEmpty: {
      errorMessage: 'Bio is required',
    },
    isLength: {
      options: { max: 500 },
      errorMessage: 'Bio must be less than 500 characters',
    },
    trim: true,
  },
  country: {
    notEmpty: {
      errorMessage: 'Country is required',
    },
    trim: true,
  },
  city: {
    notEmpty: {
      errorMessage: 'City is required',
    },
    trim: true,
  },
  collegeId: {
    notEmpty: {
      errorMessage: 'College is required',
    },
    isMongoId: {
      errorMessage: 'Invalid college ID',
    },
  },
  course: {
    notEmpty: {
      errorMessage: 'Course is required',
    },
    trim: true,
  },
  year: {
    notEmpty: {
      errorMessage: 'Year is required',
    },
    isInt: {
      options: { min: 1, max: 10 },
      errorMessage: 'Year must be between 1 and 10',
    },
  },
};
