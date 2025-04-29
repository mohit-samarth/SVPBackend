import { rateLimit } from 'express-rate-limit';
import { validationErrorWithData } from '../helpers/apiResponse.js';

export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 5 OTP requests per windowMs
  message:
    'Too many OTP requests from this IP, please try again after 5 minutes.',
});

// Rate limiting for password reset requests
export const resetPasswordRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message:
    'Too many password reset attempts from this IP, please try again after 15 minutes.',
});
