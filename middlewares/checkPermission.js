// import {
//   ErrorResponse,
//   ErrorResponseWithData,
//   successResponseWithData,
// } from '../helpers/apiResponse.js';
// import { AccessPermission } from '../models/accessNPermissions/accessPermissionSchema.js';
// import { asyncErrorHandler } from '../middlewares/asyncErrorHandler.js';

// const USER_ROLES = {
//   SUPER_ADMIN: 'superAdmin',
//   SYSTEM_ADMIN: 'systemAdmin',
//   ANCHAL_PRAMUKH: 'anchalPramukh',
//   SANKUL_PRAMUKH: 'sankulPramukh',
//   SANCH_PRAMUKH: 'sanchPramukh',
//   UP_SANCH_PRAMUKH: 'upSanchPramukh',
//   PRASHIKSHAN_PRAMUKH: 'prashikshanPramukh',
// };

// const permissionMap = {
//   GET: 'canRead',
//   POST: 'canCreate',
//   PUT: 'canUpdate',
//   PATCH: 'canUpdate',
//   DELETE: 'canDelete',
// };

// const getModuleAndSubmodule = (req) => {
//   const path = req.baseUrl + req.path;
//   const routeParts = path
//     .split('/')
//     .filter((part) => part && !part.includes('api') && !part.match(/v\d+/));

//   const formatName = (str) => {
//     const deCamelCased = str.replace(/([a-z])([A-Z])/g, '$1 $2');
//     const deKebabCased = deCamelCased.replace(/-/g, ' ');
//     const words = deKebabCased.split(' ');
//     const formattedWords = words.map(
//       (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//     );
//     return formattedWords.join(' ');
//   };

//   const moduleName = formatName(routeParts[0] || '');
//   const submoduleName = formatName(routeParts[1] || '');

//   console.log('Route Processing:', {
//     originalPath: path,
//     routeParts,
//     moduleName,
//     submoduleName,
//   });

//   return {
//     moduleName,
//     submoduleName,
//   };
// };

// export const checkPermission = asyncErrorHandler(async (req, res, next) => {
//   try {
//     const user = req.user;
//     if (!user) {
//       return ErrorResponseWithData(
//         res,
//         'Authentication required',
//         {
//           status: 'auth_required',
//           detail: 'User must be authenticated to access this resource',
//         },
//         401
//       );
//     }

//     const userRole = user.role;
//     const userRoleSecondary = user.secondaryRole;
//     const method = req.method;
//     const requiredPermission = permissionMap[method];

//     if (userRole === USER_ROLES.SUPER_ADMIN) {
//       return next();
//     }

//     const validRoles = [userRole];
//     if (userRoleSecondary) {
//       validRoles.push(userRoleSecondary);
//     }

//     const invalidRoles = validRoles.filter(
//       (role) => !Object.values(USER_ROLES).includes(role)
//     );

//     if (invalidRoles.length > 0) {
//       return ErrorResponseWithData(
//         res,
//         'Invalid user role',
//         {
//           status: 'invalid_role',
//           userId: user._id,
//           userName: user.userName,
//           invalidRoles,
//           validRoles: Object.values(USER_ROLES),
//         },
//         403
//       );
//     }

//     const { moduleName, submoduleName } = getModuleAndSubmodule(req);

//     if (!moduleName || !submoduleName) {
//       return ErrorResponseWithData(
//         res,
//         'Invalid route structure',
//         {
//           status: 'invalid_route',
//           detail: 'Could not determine module or submodule from route',
//           path: req.baseUrl + req.path,
//         },
//         400
//       );
//     }

//     console.log('Permission Check Details:', {
//       userId: user._id,
//       userRoles: validRoles,
//       moduleName,
//       submoduleName,
//       method,
//       requiredPermission,
//     });

//     const individualPermission = await AccessPermission.findOne({
//       assignedTo: user._id,
//       moduleName,
//       submoduleName,
//       revokedAt: null,
//     }).lean();

//     console.log('Individual Permission Found:', individualPermission);

//     if (individualPermission && individualPermission[requiredPermission]) {
//       return next();
//     }

//     let rolePermission = null;
//     for (const role of validRoles) {
//       const permission = await AccessPermission.findOne({
//         assignToRole: role,
//         moduleName,
//         submoduleName,
//         revokedAt: null,
//       }).lean();

//       console.log(`Role Permission Found for ${role}:`, permission);

//       if (permission && permission[requiredPermission]) {
//         rolePermission = permission;
//         break;
//       }
//     }

//     if (!individualPermission && !rolePermission) {
//       return ErrorResponseWithData(
//         res,
//         'Permission not found',
//         {
//           status: 'no_permissions',
//           detail: `No permissions found for ${moduleName}/${submoduleName}`,
//           userRoles: validRoles,
//           moduleName,
//           submoduleName,
//           method,
//           requiredPermission,
//         },
//         403
//       );
//     }

//     if (rolePermission) {
//       return next();
//     }

//     return ErrorResponseWithData(
//       res,
//       'Access denied',
//       {
//         status: 'permission_denied',
//         detail: `Permission denied for ${method} operation`,
//         userRoles: validRoles,
//         moduleName,
//         submoduleName,
//         method,
//         requiredPermission,
//         hasIndividualPermission: !!individualPermission,
//         hasRolePermission: !!rolePermission,
//       },
//       403
//     );
//   } catch (error) {
//     console.error('Permission Check Error:', error);
//     return ErrorResponseWithData(
//       res,
//       'Permission check failed',
//       {
//         status: 'check_failed',
//         error: error.message,
//         stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//       },
//       500
//     );
//   }
// });



//!probattion
import {
  ErrorResponse,
  ErrorResponseWithData,
  successResponseWithData,
} from '../helpers/apiResponse.js';
import { AccessPermission } from '../models/accessNPermissions/accessPermissionSchema.js';
import { asyncErrorHandler } from '../middlewares/asyncErrorHandler.js';

const USER_ROLES = {
  SUPER_ADMIN: 'superAdmin',
  SYSTEM_ADMIN: 'systemAdmin',
  ANCHAL_PRAMUKH: 'anchalPramukh',
  SANKUL_PRAMUKH: 'sankulPramukh',
  SANCH_PRAMUKH: 'sanchPramukh',
  UP_SANCH_PRAMUKH: 'upSanchPramukh',
  PRASHIKSHAN_PRAMUKH: 'prashikshanPramukh',
};

const PROBATION_STATUS = {
  PERMANENT: 'permanent',
  TEMPORARY: 'temporary',
};

const permissionMap = {
  GET: 'canRead',
  POST: 'canCreate',
  PUT: 'canUpdate',
  PATCH: 'canUpdate',
  DELETE: 'canDelete',
};

const getModuleAndSubmodule = (req) => {
  const path = req.baseUrl + req.path;
  const routeParts = path
    .split('/')
    .filter((part) => part && !part.includes('api') && !part.match(/v\d+/));

  const formatName = (str) => {
    const deCamelCased = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    const deKebabCased = deCamelCased.replace(/-/g, ' ');
    const words = deKebabCased.split(' ');
    const formattedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return formattedWords.join(' ');
  };

  const moduleName = formatName(routeParts[0] || '');
  const submoduleName = formatName(routeParts[1] || '');

  console.log('Route Processing:', {
    originalPath: path,
    routeParts,
    moduleName,
    submoduleName,
  });

  return {
    moduleName,
    submoduleName,
  };
};

export const checkPermission = asyncErrorHandler(async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return ErrorResponseWithData(
        res,
        'Authentication required',
        {
          status: 'auth_required',
          detail: 'User must be authenticated to access this resource',
        },
        401
      );
    }

    const userRole = user.role;
    const userRoleSecondary = user.secondaryRole;
    const probationStatus = user.probationStatus || PROBATION_STATUS.PERMANENT;
    const method = req.method;
    const requiredPermission = permissionMap[method];

    // Super admins with permanent status bypass all permission checks
    if (
      userRole === USER_ROLES.SUPER_ADMIN &&
      probationStatus === PROBATION_STATUS.PERMANENT
    ) {
      return next();
    }

    const validRoles = [userRole];
    if (userRoleSecondary) {
      validRoles.push(userRoleSecondary);
    }

    const invalidRoles = validRoles.filter(
      (role) => !Object.values(USER_ROLES).includes(role)
    );

    if (invalidRoles.length > 0) {
      return ErrorResponseWithData(
        res,
        'Invalid user role',
        {
          status: 'invalid_role',
          userId: user._id,
          userName: user.userName,
          invalidRoles,
          validRoles: Object.values(USER_ROLES),
        },
        403
      );
    }

    const { moduleName, submoduleName } = getModuleAndSubmodule(req);

    if (!moduleName || !submoduleName) {
      return ErrorResponseWithData(
        res,
        'Invalid route structure',
        {
          status: 'invalid_route',
          detail: 'Could not determine module or submodule from route',
          path: req.baseUrl + req.path,
        },
        400
      );
    }

    console.log('Permission Check Details:', {
      userId: user._id,
      userRoles: validRoles,
      probationStatus,
      moduleName,
      submoduleName,
      method,
      requiredPermission,
    });

    // Check for specific individual permissions with matching probation status
    const specificIndividualPermission = await AccessPermission.findOne({
      assignedTo: user._id,
      moduleName,
      submoduleName,
      probationStatus,
      revokedAt: null,
    }).lean();

    console.log(
      'Specific Individual Permission Found:',
      specificIndividualPermission
    );

    // Check for generic individual permissions (without probation status)
    const genericIndividualPermission = await AccessPermission.findOne({
      assignedTo: user._id,
      moduleName,
      submoduleName,
      probationStatus: { $exists: false },
      revokedAt: null,
    }).lean();

    console.log(
      'Generic Individual Permission Found:',
      genericIndividualPermission
    );

    // If specific individual permission exists and has the required permission, grant access
    if (
      specificIndividualPermission &&
      specificIndividualPermission[requiredPermission]
    ) {
      return next();
    }

    // If generic individual permission exists and has the required permission, grant access
    if (
      genericIndividualPermission &&
      genericIndividualPermission[requiredPermission]
    ) {
      return next();
    }

    // Check for role-based permissions with matching probation status
    let specificRolePermission = null;
    let genericRolePermission = null;

    for (const role of validRoles) {
      // Check for specific role permission matching probation status
      const specificPermission = await AccessPermission.findOne({
        assignToRole: role,
        moduleName,
        submoduleName,
        probationStatus,
        revokedAt: null,
      }).lean();

      console.log(
        `Specific Role Permission Found for ${role} (${probationStatus}):`,
        specificPermission
      );

      if (specificPermission && specificPermission[requiredPermission]) {
        specificRolePermission = specificPermission;
        break;
      }

      // Check for generic role permission (without probation status)
      const genericPermission = await AccessPermission.findOne({
        assignToRole: role,
        moduleName,
        submoduleName,
        probationStatus: { $exists: false },
        revokedAt: null,
      }).lean();

      console.log(
        `Generic Role Permission Found for ${role}:`,
        genericPermission
      );

      if (genericPermission && genericPermission[requiredPermission]) {
        genericRolePermission = genericPermission;
        // Don't break here, continue checking for specific permissions for other roles
      }
    }

    // Prioritize specific role permission over generic
    if (specificRolePermission) {
      return next();
    }

    // Use generic role permission if available
    if (genericRolePermission) {
      return next();
    }

    // No valid permissions found
    if (
      !specificIndividualPermission &&
      !genericIndividualPermission &&
      !specificRolePermission &&
      !genericRolePermission
    ) {
      return ErrorResponseWithData(
        res,
        'Permission not found',
        {
          status: 'no_permissions',
          detail: `No permissions found for ${moduleName}/${submoduleName}`,
          userRoles: validRoles,
          probationStatus,
          moduleName,
          submoduleName,
          method,
          requiredPermission,
        },
        403
      );
    }

    // If we get here, the user has permissions records but none with the required permission
    return ErrorResponseWithData(
      res,
      'Access denied',
      {
        status: 'permission_denied',
        detail: `Permission denied for ${method} operation`,
        userRoles: validRoles,
        probationStatus,
        moduleName,
        submoduleName,
        method,
        requiredPermission,
        hasSpecificIndividualPermission: !!specificIndividualPermission,
        hasGenericIndividualPermission: !!genericIndividualPermission,
        hasSpecificRolePermission: !!specificRolePermission,
        hasGenericRolePermission: !!genericRolePermission,
      },
      403
    );
  } catch (error) {
    console.error('Permission Check Error:', error);
    return ErrorResponseWithData(
      res,
      'Permission check failed',
      {
        status: 'check_failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      500
    );
  }
});