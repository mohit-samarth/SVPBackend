import ErrorHandler from './error.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/userRoles/userSchema.js';
import { asyncErrorHandler } from './asyncErrorHandler.js';
import {
  ErrorBadRequestResponseWithData,
  ErrorResponse,
  successResponse,
  successResponseWithData,
  validationErrorWithData,
  ErrorResponseWithData,
} from '../helpers/apiResponse.js';

export const isAuthenticated = asyncErrorHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ErrorHandler('No token provided', 401));
  }

  try {
    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler('User not found', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler('Invalid token', 401));
  }
});

export const isSuperAdmin = asyncErrorHandler(async (req, res, next) => {
  if (req.user.role !== 'superAdmin') {
    return next(new ErrorHandler('Only Super Admin Allowed', 401));
  }
  next();
});
export const isPrashikshanPramukhFromAnchal = asyncErrorHandler(
  async (req, res, next) => {
    if (req.user.role !== 'prashikshanPramukh') {
      return next(new ErrorHandler('Only Prashikshan Pramukh Allowed', 401));
    }
    next();
  }
);

export const isPrashikshanPramukhFromAnchalNew = asyncErrorHandler(
  async (req, res, next) => {
    if (req.user.secondaryRole !== 'prashikshanPramukh') {
      return next(new ErrorHandler('Only Prashikshan Pramukh Allowed', 401));
    }
    next();
  }
);


// Middleware to authorize roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login to access this resource"
      });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    
    // Special handling for hierarchical roles
    const isHigherRole = checkHierarchicalAccess(req.user.role, allowedRoles);

    if (!hasRole && !isHigherRole) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource`
      });
    }

    next();
  };
};

// Helper function to check hierarchical role access
const checkHierarchicalAccess = (userRole, allowedRoles) => {
  // Define role hierarchy (higher index means higher privilege)
  const roleHierarchy = [
    'upSanchPramukh',
    'sanchPramukh',
    'sankulPramukh',
    'anchalPramukh',
    'systemAdmin',
    'superAdmin'
  ];

  const userRoleIndex = roleHierarchy.indexOf(userRole);
  
  // If user role is not in hierarchy, return false
  if (userRoleIndex === -1) return false;

  // Check if user has higher or equal privilege than any allowed role
  return allowedRoles.some(role => {
    const allowedRoleIndex = roleHierarchy.indexOf(role);
    return allowedRoleIndex !== -1 && userRoleIndex >= allowedRoleIndex;
  });
};

