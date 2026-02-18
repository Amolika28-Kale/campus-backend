import twilio from 'twilio';
import env from '../config/env.js';
import { generateOTP } from '../utils/helpers.js';

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// Initialize Twilio client
const twilioClient = env.twilio.accountSid && env.twilio.authToken 
  ? twilio(env.twilio.accountSid, env.twilio.authToken)
  : null;

/**
 * Generate and send OTP to phone number
 * @param {string} phone - Phone number
 * @returns {Promise<object>} - Result object
 */
export const sendOTP = async (phone) => {
  // Check rate limiting
  const rateKey = `otp_rate_${phone}`;
  const rateData = otpStore.get(rateKey);
  
  if (rateData) {
    const now = Date.now();
    const timeSinceLastRequest = now - rateData.timestamp;
    const rateLimitWindow = env.otpExpireMinutes * 60 * 1000;
    
    if (timeSinceLastRequest < rateLimitWindow) {
      throw new Error(`Please wait ${Math.ceil((rateLimitWindow - timeSinceLastRequest) / 1000)} seconds before requesting another OTP`);
    }
  }

  // Generate OTP
  const otp = generateOTP(env.otpLength);
  const otpKey = `otp_${phone}`;
  
  // Store OTP with expiry
  otpStore.set(otpKey, {
    otp,
    attempts: 0,
    expiresAt: Date.now() + env.otpExpireMinutes * 60 * 1000,
  });

  // Store rate limiting
  otpStore.set(rateKey, {
    timestamp: Date.now(),
    count: (rateData?.count || 0) + 1,
  });

  // Send OTP via Twilio (or log in development)
  if (twilioClient && env.twilio.phoneNumber) {
    try {
      await twilioClient.messages.create({
        body: `Your verification code is: ${otp}. Valid for ${env.otpExpireMinutes} minutes.`,
        from: env.twilio.phoneNumber,
        to: phone,
      });
      console.log(`OTP sent to ${phone}: ${otp}`);
    } catch (error) {
      console.error('Twilio Error:', error);
      // In development, allow fallback to console
      if (env.nodeEnv !== 'development') {
        throw new Error('Failed to send OTP. Please try again.');
      }
    }
  } else {
    // Development mode - log OTP to console
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return {
    success: true,
    message: 'OTP sent successfully',
    // Don't return actual OTP in production
    ...(env.nodeEnv === 'development' && { otp }),
  };
};

/**
 * Verify OTP
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @returns {Promise<object>} - Result object
 */
export const verifyOTP = async (phone, otp) => {
  const otpKey = `otp_${phone}`;
  const storedData = otpStore.get(otpKey);

  if (!storedData) {
    throw new Error('OTP not found or expired. Please request a new OTP.');
  }

  // Check if OTP expired
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(otpKey);
    throw new Error('OTP expired. Please request a new OTP.');
  }

  // Check max attempts
  if (storedData.attempts >= env.maxOtpAttempts) {
    otpStore.delete(otpKey);
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // Verify OTP
  if (storedData.otp !== otp) {
    storedData.attempts += 1;
    otpStore.set(otpKey, storedData);
    throw new Error(`Invalid OTP. ${env.maxOtpAttempts - storedData.attempts} attempts remaining.`);
  }

  // OTP verified - remove from store
  otpStore.delete(otpKey);

  return {
    success: true,
    message: 'OTP verified successfully',
  };
};

/**
 * Clean up expired OTPs (call periodically)
 */
export const cleanupOTPStore = () => {
  const now = Date.now();
  
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt && now > value.expiresAt) {
      otpStore.delete(key);
    }
    if (key.startsWith('otp_rate_') && now - value.timestamp > 24 * 60 * 60 * 1000) {
      otpStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupOTPStore, 5 * 60 * 1000);

export default {
  sendOTP,
  verifyOTP,
  cleanupOTPStore,
};
