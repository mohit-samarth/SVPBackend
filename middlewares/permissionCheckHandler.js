import { AccessPermission } from '../models/accessNPermissions/accessPermissionSchema.js';
import {
  ErrorBadRequestResponseWithData,
  ErrorResponse,
  successResponse,
  successResponseWithData,
  validationErrorWithData,
  ErrorResponseWithData,
} from '../helpers/apiResponse.js';

export const checkPermission = (
  moduleName,
  submoduleName,
  requiredPermission
) => {
  return async (req, res, next) => {
    try {
      console.log('\n=== Permission Check Started ===');
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('📍 Path:', req.path);
      console.log('🎯 Checking:', {
        moduleName,
        submoduleName,
        requiredPermission,
      });

      if (!req.user?._id) {
        console.log('❌ Authentication Failed: No user found');
        return ErrorResponse(res, 'User not authenticated', 401);
      }

      const userId = req.user._id;
      const userRole = req.user.role;

      console.log('👤 User:', {
        userId,
        userRole,
        userName: req.user.userName,
      });

      if (userRole === 'superAdmin') {
        console.log('✅ SuperAdmin Access Granted');
        return next();
      }

      const userPermission = await AccessPermission.findOne({
        assignedTo: userId,
        moduleName,
        submoduleName,
        revokedAt: null,
      }).lean();

      console.log(
        '🔎 Individual Permission:',
        userPermission ? 'Found' : 'Not Found'
      );

      if (userPermission) {
        const hasPermission =
          userPermission[
            `can${
              requiredPermission.charAt(0).toUpperCase() +
              requiredPermission.slice(1)
            }`
          ];

        if (hasPermission) {
          console.log('✅ Access Granted: Individual Permission');
          return next();
        }

        console.log('❌ Access Denied: Individual Permission');
        return ErrorResponse(
          res,
          `You don't have permission to ${requiredPermission} in ${moduleName} - ${submoduleName}`,
          403
        );
      }

      console.log('🔎 Checking Role Permissions');

      const rolePermission = await AccessPermission.findOne({
        assignToRole: userRole,
        moduleName,
        submoduleName,
        revokedAt: null,
      }).lean();

      if (!rolePermission) {
        console.log('❌ Access Denied: No Role Permission Found');
        return ErrorResponse(
          res,
          `Your role (${userRole}) doesn't have access to ${moduleName} - ${submoduleName}`,
          403
        );
      }

      const hasRolePermission =
        rolePermission[
          `can${
            requiredPermission.charAt(0).toUpperCase() +
            requiredPermission.slice(1)
          }`
        ];

      console.log('Role Permission:', {
        exists: true,
        hasPermission: hasRolePermission,
      });

      if (!hasRolePermission) {
        console.log('❌ Access Denied: Insufficient Role Permission');
        return ErrorResponse(
          res,
          `Your role (${userRole}) doesn't have permission to ${requiredPermission} in ${moduleName} - ${submoduleName}`,
          403
        );
      }

      console.log('✅ Access Granted: Role Permission');
      console.log('=== Permission Check Completed ===\n');
      next();
    } catch (error) {
      console.error('❌ Error:', error);
      return ErrorResponse(res, 'Error checking permissions', 500);
    }
  };
};

export const permissionCheck = {
  create: (moduleName, submoduleName) =>
    checkPermission(moduleName, submoduleName, 'create'),
  read: (moduleName, submoduleName) =>
    checkPermission(moduleName, submoduleName, 'read'),
  update: (moduleName, submoduleName) =>
    checkPermission(moduleName, submoduleName, 'update'),
  delete: (moduleName, submoduleName) =>
    checkPermission(moduleName, submoduleName, 'delete'),
};
