//! it changes role field directly
// export const toggleRole = asyncErrorHandler(async (req, res, next) => {
//   const { userId } = req.params;
//   const switchedByUser = req.user;

//   // Find user and verify existence
//   const user = await User.findById(userId);
//   if (!user) {
//     return ErrorBadRequestResponseWithData(
//       res,
//       'user_not_found',
//       'User not found!'
//     );
//   }

//   // Verify user has an allowed role
//   if (!Object.values(ALLOWED_ROLES).includes(user.role)) {
//     return ErrorBadRequestResponseWithData(
//       res,
//       'invalid_role',
//       'Role switching is only allowed between Anchal Pramukh and Prashikshan Pramukh!'
//     );
//   }

//   // If user is in temporary role, revert to original
//   if (user.isTemporaryRole) {
//     return await handleRoleRevert(user, switchedByUser, res);
//   }

//   // Otherwise, toggle to new role
//   return await handleRoleToggle(user, switchedByUser, res);
// });

// // Helper function to handle role toggle
// const handleRoleToggle = async (user, switchedByUser, res) => {
//   const newRole =
//     user.role === ALLOWED_ROLES.ANCHAL_PRAMUKH
//       ? ALLOWED_ROLES.PRASHIKSHAN_PRAMUKH
//       : ALLOWED_ROLES.ANCHAL_PRAMUKH;

//   const updateData = {
//     role: newRole,
//     originalRole: user.role,
//     originalAnchalAreaId: user.anchalAreaId,
//     originalAnchalAreaFromUser: user.anchalAreaFromUser,
//     isTemporaryRole: true,
//     $push: {
//       roleSwitchHistory: {
//         previousRole: user.role,
//         newRole,
//         switchedBy: switchedByUser._id,
//         switchedAt: new Date(),
//         isTemporary: true,
//       },
//     },
//   };

//   const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
//     new: true,
//     runValidators: true,
//   });

//   return sendRoleUpdateResponse(
//     updatedUser,
//     switchedByUser,
//     'Role toggled successfully',
//     res
//   );
// };

// // Helper function to handle role revert
// const handleRoleRevert = async (user, switchedByUser, res) => {
//   const updateData = {
//     role: user.originalRole,
//     anchalAreaId: user.originalAnchalAreaId,
//     anchalAreaFromUser: user.originalAnchalAreaFromUser,
//     isTemporaryRole: false,
//     $unset: {
//       originalRole: '',
//       originalAnchalAreaId: '',
//       originalAnchalAreaFromUser: '',
//     },
//     $push: {
//       roleSwitchHistory: {
//         previousRole: user.role,
//         newRole: user.originalRole,
//         switchedBy: switchedByUser._id,
//         switchedAt: new Date(),
//         isTemporary: false,
//       },
//     },
//   };

//   const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
//     new: true,
//     runValidators: true,
//   });

//   return sendRoleUpdateResponse(
//     updatedUser,
//     switchedByUser,
//     'Successfully reverted to original role',
//     res
//   );
// };

// // Helper function to send standardized response
// const sendRoleUpdateResponse = (user, switchedByUser, message, res) => {
//   const token = user.getJWTToken();

//   return successResponseWithData(
//     res,
//     {
//       user: {
//         _id: user._id,
//         userName: user.userName,
//         svpEmail: user.svpEmail,
//         currentRole: user.role,
//         originalRole: user.originalRole,
//         anchalAreaId: user.anchalAreaId,
//         isTemporaryRole: user.isTemporaryRole,
//         switchedBy: switchedByUser.userName,
//         switchedAt: new Date(),
//       },
//       token,
//     },
//     message
//   );
// };

import { User } from '../../models/userRoles/userSchema.js';

import { sendEmail } from '../../middlewares/nodemailerEmail.js';
import crypto from 'crypto';
import { UserKif } from '../../models/userKifs/userKifSchema.js';
import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import ErrorHandler from '../../middlewares/error.js';


import { sendToken } from '../../utils/jwtToken.js';
import {
  successResponse,
successResponseWithData,
  ErrorBadRequestResponseWithData,
  notFoundResponse,
  validationErrorWithData,

} from '../../helpers/apiResponse.js';
import bcrypt from 'bcrypt';
import { AnchalAreaNew } from '../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';
import { SankulAreaNew } from '../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { SanchAreaNew } from '../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';
import { UpSanchAreaNew } from '../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import Form from '../../models/userKifs/acharyaKifSchema.js';
import {GramSamitiInfo } from '../../models/gramSamiti/gramSamitiInfoSchema.js'
import {GramSamiti } from '../../models/gramSamiti/gramSamitiSchema.js'
import mongoose from 'mongoose';

export const createSuperAdmin = asyncErrorHandler(async (req, res, next) => {
  const { userName, svpEmail, password, role } = req.body;

  if (!userName || !svpEmail || !password || !role) {
    return validationErrorWithData(
      res,
      'missing_credentials',

      'Please fill out the full form!'
    );
  }

  if (!svpEmail || svpEmail.trim() === '') {
    return validationErrorWithData(
      res,
      'valid_svp_email_required',

      'Please provide a valid SVP email !'
    );
  }
  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'User already exists with this email!'
    );
  }

  const existingSuperAdmin = await User.findOne({
    svpEmail,
    role: 'superAdmin',
  });
  if (existingSuperAdmin) {
    return ErrorBadRequestResponseWithData(
      res,
      'super_admin_already_exist',

      'Super Admin already exists with this email!'
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    isPasswordChanged: false,
    role,
  });
  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Account Details',
    text: `Hello ${userName},

    Your account has been successfully created as Super Admin.

    Login Details:
      Email: ${svpEmail}

    You can now log in using the password you provided during registration.

    Best regards,
    SVP Team`,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(200).json({
    success: true,
    message: 'Super Admin registered successfully!',
    token,
    newUser,
  });
});

export const getProfileSvpRoleAll = asyncErrorHandler((req, res) => {
  return successResponseWithData(
    res,
    'Profile fetched successfully!',
    req.user
  );
});

export const logoutSvpRoleAll = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;

  if (user) {
    if (user.isDeleted) {
      res.cookie('token', '', {
        expires: new Date(Date.now()),
        httpOnly: true,
      });

      return successResponseWithData(
        res,
        'isdelete_true',
        'Your account has been deleted. You have been logged out successfully.'
      );
    }
  }

  res.cookie('token', '', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  return successResponse(res, 'Logged out successfully');
});
export const createSystemAdmin = asyncErrorHandler(async (req, res, next) => {
  const { userName, svpEmail } = req.body;

  if (!userName || !svpEmail) {
    return validationErrorWithData(
      res,
      'missing_credentials',

      'Please fill out the full form!'
    );
  }

  if (!svpEmail || svpEmail.trim() === '') {
    return validationErrorWithData(
      res,
      'valid_svp_email_required',

      'Please provide a valid email!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'User already exists with this email!'
    );
  }

  const existingSystemAdmin = await User.findOne({
    svpEmail,
    role: 'systemAdmin',
  });
  if (existingSystemAdmin) {
    return ErrorBadRequestResponseWithData(
      res,
      'system_admin_already_exist',

      'System Admin already exists with this email!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,

    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    role: 'systemAdmin',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as System Admin.

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

        Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(200).json({
    success: true,
    message: 'User registered successfully!',
    token,
    newUser,
  });
});




export const createAnchalPramukh = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail, anchalAreaId, createdFromKifId } = req.body;

  if (!svpEmail || !anchalAreaId || !createdFromKifId) {
    return validationErrorWithData(
      res,
      'missing_credentials',

      'Please provide all required fields!'
    );
  }

  const userKif = await UserKif.findById(createdFromKifId);
  if (!userKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'userkif_not_found',

      'Associated UserKif record not found!'
    );
  }

  const userName = `${userKif.firstName || ''} ${
    userKif.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_kif',

      'First name or last name is missing in UserKif!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'User already exists with this email!'
    );
  }

  const existingAnchalPramukhForArea = await User.findOne({
    anchalAreaId,

    role: 'anchalPramukh',
  });

  if (existingAnchalPramukhForArea) {
    return ErrorBadRequestResponseWithData(
      res,

      'anchal_area_already_assigned',

      'An Anchal Pramukh is already assigned to this Anchal Area!'
    );
  }

  const existingAnchalPramukhForKif = await User.findOne({
    createdFromKifId,

    role: 'anchalPramukh',
  });

  if (existingAnchalPramukhForKif) {
    return ErrorBadRequestResponseWithData(
      res,

      'kif_already_assigned',

      'This UserKif is already associated with an Anchal Pramukh!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',

      'Specified Anchal area not found!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    createdFromKifId,
    anchalAreaFromUser,
    role: 'anchalPramukh',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Anchal Pramukh.

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      createdFromKifId: newUser.createdFromKifId,
      anchalName: anchalDoc.anchalName,
    },
    token,
    message:
      'Anchal Pramukh registered successfully! Temporary password sent to email.',
  });
});


export const updateAnchalPramukh = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { svpEmail, anchalAreaId, createdFromKifId } = req.body;

  // Check if user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_not_found',
      'Anchal Pramukh not found!'
    );
  }

  // Validate required fields
  if (!svpEmail || !anchalAreaId || !createdFromKifId) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  // Check if new email already exists for another user
  const emailExists = await User.findOne({
    svpEmail,
    _id: { $ne: id }, // Exclude current user
  });
  if (emailExists) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',
      'User already exists with this email!'
    );
  }

  // Validate UserKif
  const userKif = await UserKif.findById(createdFromKifId);
  if (!userKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'userkif_not_found',
      'Associated UserKif record not found!'
    );
  }

  const userName = `${userKif.firstName || ''} ${
    userKif.lastName || ''
  }`.trim();
  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_kif',
      'First name or last name is missing in UserKif!'
    );
  }

  // Check if another Anchal Pramukh exists for the area
  const existingAnchalPramukhForArea = await User.findOne({
    anchalAreaId,
    role: 'anchalPramukh',
    _id: { $ne: id }, // Exclude current user
  });

  if (existingAnchalPramukhForArea) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_already_assigned',
      'An Anchal Pramukh is already assigned to this Anchal Area!'
    );
  }

  // Check if KIF is already associated with another Anchal Pramukh
  const existingAnchalPramukhForKif = await User.findOne({
    createdFromKifId,
    role: 'anchalPramukh',
    _id: { $ne: id }, // Exclude current user
  });

  if (existingAnchalPramukhForKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'kif_already_assigned',
      'This UserKif is already associated with an Anchal Pramukh!'
    );
  }

  // Validate Anchal Area
  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();
  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',
      'Anchal Name is missing from Anchal Area!'
    );
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      userName,
      svpEmail,
      anchalAreaId,
      createdFromKifId,
      anchalAreaFromUser,
    },
    { new: true }
  );

  // Send response
  res.status(200).json({
    user: {
      _id: updatedUser._id,
      userName: updatedUser.userName,
      svpEmail: updatedUser.svpEmail,
      role: updatedUser.role,
      anchalAreaId: updatedUser.anchalAreaId,
      createdFromKifId: updatedUser.createdFromKifId,
      anchalName: anchalDoc.anchalName,
    },
    message: 'Anchal Pramukh updated successfully!',
  });
});

export const getTemporaryPasswordsAnchalPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'anchalPramukh' })
      .select('temporaryPassword temporaryPasswordExpiresAt')
      .populate('userName', 'userName')
      .populate('role', 'role')
      .populate('anchalAreaFromUser', 'anchalAreaFromUser ')
      .populate('svpEmail', 'svpEmail');
    if (!users.length) {
      return notFoundResponse(res, 'No Anchal Pramukh found!');
    }
    return successResponseWithData(
      res,
      'Temporary password information for all Anchal Pramukh fetched successfully!',
      users
    );
  }
);

export const getCurrentRoleStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('roleSwitchHistory.switchedBy', 'userName svpEmail')
      .select(
        'userName svpEmail role originalRole isTemporaryRole roleSwitchHistory'
      );

    if (!user) {
      return ErrorBadRequestResponseWithData(
        res,
        'user_not_found',
        'User not found!'
      );
    }

    const latestSwitch =
      user.roleSwitchHistory[user.roleSwitchHistory.length - 1] || null;

    const response = {
      userId: user._id,
      userName: user.userName,
      svpEmail: user.svpEmail,
      currentRole: user.role,
      originalRole: user.originalRole,
      isTemporaryRole: user.isTemporaryRole,
      previousRole: latestSwitch?.previousRole || null,
      newRole: latestSwitch?.newRole || null,
      switchedBy: latestSwitch?.switchedBy || null,
      switchedAt: latestSwitch?.switchedAt || null,
      isTemporary: latestSwitch?.isTemporary || false,
    };

    return successResponseWithData(
      res,
      response,
      'Current role status retrieved successfully'
    );
  }
);

export const getRoleSwitchHistory = asyncErrorHandler(
  async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      // Populate role switch history
      .populate({
        path: 'roleSwitchHistory.switchedBy',
        select: 'userName svpEmail role',
      })
      // Populate secondary role assigner
      .populate({
        path: 'secondaryRoleAssignedBy',
        select: 'userName svpEmail role',
      })
      .select(
        '_id userName svpEmail role originalRole isTemporaryRole ' +
          'roleSwitchHistory secondaryRole secondaryRoleAssignedBy ' +
          'originalAnchalAreaId originalAnchalAreaFromUser'
      );

    if (!user) {
      return ErrorBadRequestResponseWithData(
        res,
        'user_not_found',
        'User not found!'
      );
    }

    // Get the latest role switch
    const latestSwitch =
      user.roleSwitchHistory.length > 0
        ? user.roleSwitchHistory[user.roleSwitchHistory.length - 1]
        : null;

    // Format role switch history
    const formattedHistory = user.roleSwitchHistory.map((historyItem) => ({
      previousRole: historyItem.previousRole,
      newRole: historyItem.newRole,
      switchedAt: historyItem.switchedAt,
      isTemporary: historyItem.isTemporary,
      switchedBy: historyItem.switchedBy
        ? {
            userId: historyItem.switchedBy._id,
            userName: historyItem.switchedBy.userName,
            svpEmail: historyItem.switchedBy.svpEmail,
            role: historyItem.switchedBy.role,
          }
        : null,
    }));

    const response = {
      // User basic info
      userId: user._id,
      userName: user.userName,
      svpEmail: user.svpEmail,

      // Role information
      currentRole: user.role,
      originalRole: user.originalRole,
      isTemporaryRole: user.isTemporaryRole,
      currentSecondaryRole: user.secondaryRole,

      // Role assignment details
      secondaryRoleAssignedBy: user.secondaryRoleAssignedBy
        ? {
            userId: user.secondaryRoleAssignedBy._id,
            userName: user.secondaryRoleAssignedBy.userName,
            svpEmail: user.secondaryRoleAssignedBy.svpEmail,
            role: user.secondaryRoleAssignedBy.role,
          }
        : null,

      // Area information
      originalAnchalAreaId: user.originalAnchalAreaId,
      originalAnchalAreaFromUser: user.originalAnchalAreaFromUser,

      // Latest switch information
      latestSwitch: latestSwitch
        ? {
            previousRole: latestSwitch.previousRole,
            newRole: latestSwitch.newRole,
            switchedAt: latestSwitch.switchedAt,
            isTemporary: latestSwitch.isTemporary,
            switchedBy: latestSwitch.switchedBy
              ? {
                  userId: latestSwitch.switchedBy._id,
                  userName: latestSwitch.switchedBy.userName,
                  svpEmail: latestSwitch.switchedBy.svpEmail,
                  role: latestSwitch.switchedBy.role,
                }
              : null,
          }
        : null,

      // Complete role switch history
      roleSwitchHistory: formattedHistory,
    };

    return successResponseWithData(
      res,
      response,
      'Role switch history retrieved successfully'
    );
  }
);

const ALLOWED_ROLES = {
  ANCHAL_PRAMUKH: 'anchalPramukh',
  PRASHIKSHAN_PRAMUKH: 'prashikshanPramukh',
};

export const toggleRole = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.params;
  const switchedByUser = req.user;

  const user = await User.findById(userId);
  if (!user) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_not_found',
      'User not found!'
    );
  }

  // Verify user is an anchalPramukh
  if (user.role !== ALLOWED_ROLES.ANCHAL_PRAMUKH) {
    return ErrorBadRequestResponseWithData(
      res,
      'invalid_role',
      'Only Anchal Pramukh can be assigned Prashikshan Pramukh role!'
    );
  }

  // If user already has secondary role, remove it
  if (user.secondaryRole === ALLOWED_ROLES.PRASHIKSHAN_PRAMUKH) {
    return await handleRoleRevert(user, switchedByUser, res);
  }

  // Otherwise, assign secondary role
  return await handleSecondaryRoleToggle(user, switchedByUser, res);
});

// Helper function to handle secondary role toggle
const handleSecondaryRoleToggle = async (user, switchedByUser, res) => {
  const updateData = {
    secondaryRole: ALLOWED_ROLES.PRASHIKSHAN_PRAMUKH,
    originalRole: user.role, // Always anchalPramukh
    originalAnchalAreaId: user.anchalAreaId,
    originalAnchalAreaFromUser: user.anchalAreaFromUser,
    isTemporaryRole: true,
    $push: {
      roleSwitchHistory: {
        previousRole: user.role,
        newRole: ALLOWED_ROLES.PRASHIKSHAN_PRAMUKH,
        switchedBy: switchedByUser._id,
        switchedAt: new Date(),
        isTemporary: true,
      },
    },
  };

  const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
    new: true,
    runValidators: true,
  });

  return sendRoleUpdateResponse(
    updatedUser,
    switchedByUser,
    'Secondary role assigned successfully',
    res
  );
};

// Helper function to handle role revert
const handleRoleRevert = async (user, switchedByUser, res) => {
  const updateData = {
    $unset: {
      secondaryRole: '', // Only remove secondary role
    },
    originalRole: user.role, // Keep originalRole as anchalPramukh
    isTemporaryRole: false,
    $push: {
      roleSwitchHistory: {
        previousRole: user.secondaryRole,
        newRole: user.role, // Back to anchalPramukh
        switchedBy: switchedByUser._id,
        switchedAt: new Date(),
        isTemporary: false,
      },
    },
  };

  const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
    new: true,
    runValidators: true,
  });

  return sendRoleUpdateResponse(
    updatedUser,
    switchedByUser,
    'Successfully removed secondary role',
    res
  );
};

// Helper function to send standardized response
const sendRoleUpdateResponse = (user, switchedByUser, message, res) => {
  const token = user.getJWTToken();

  return successResponseWithData(
    res,
    {
      user: {
        _id: user._id,
        userName: user.userName,
        svpEmail: user.svpEmail,
        primaryRole: user.role, // Always anchalPramukh
        secondaryRole: user.secondaryRole, // prashikshanPramukh or null
        originalRole: user.role, // Always keep as anchalPramukh
        anchalAreaId: user.anchalAreaId,
        isTemporaryRole: user.isTemporaryRole,
        switchedBy: switchedByUser.userName,
        switchedAt: new Date(),
      },
      token,
    },
    message
  );
};

export const createSankulPramukh = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail, sankulAreaId, createdFromKifId } = req.body;

  if (!svpEmail || !sankulAreaId || !createdFromKifId) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const userKif = await UserKif.findById(createdFromKifId);
  if (!userKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'userkif_not_found',
      'Associated UserKif record not found!'
    );
  }

  const userName = `${userKif.firstName || ''} ${
    userKif.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_kif',
      'First name or last name is missing in UserKif!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',
      'User already exists with this email!'
    );
  }

  const existingKifUser = await User.findOne({ createdFromKifId });
  if (existingKifUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'kif_id_already_used',
      'This KIF ID is already associated with another user!'
    );
  }

  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',

      'Specified Sankul area not found!'
    );
  }

  const existingSankulCount = await User.countDocuments({
    sankulAreaId,
    role: 'sankulPramukh',
  });
  if (existingSankulCount >= 3) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_three_sankul_pramukh_from_single_sanch_area_allowed',
      'Only three Sankul Pramukh entries can be created for a single Sankul Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();
  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    sankulAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    createdFromKifId,
    sankulAreaFromUser,
    role: 'sankulPramukh',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sankul Pramukh.

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      sankulAreaId: newUser.sankulAreaId,
      createdFromKifId: newUser.createdFromKifId,
      sankulName: sankulDoc.sankulName,
    },
    token,
    message:
      'Sankul Pramukh registered successfully! Temporary password sent to email.',
  });
});

export const getTemporaryPasswordsSankulPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'sankulPramukh' })
      .select('temporaryPassword temporaryPasswordExpiresAt')
      .populate('userName', 'userName')
      .populate('role', 'role')
      .populate('sankulAreaFromUser', 'sankulAreaFromUser')
      .populate('svpEmail', 'svpEmail');
    if (!users.length) {
      return notFoundResponse(res, 'No Sankul Pramukh found!');
    }
    return successResponseWithData(
      res,
      'Temporary password information for all Sankul Pramukh fetched successfully!',
      users
    );
  }
);

export const createSanchPramukh = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail, sanchAreaId, createdFromKifId } = req.body;

  if (!svpEmail || !sanchAreaId || !createdFromKifId) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const userKif = await UserKif.findById(createdFromKifId);
  if (!userKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'userkif_not_found',
      'Associated UserKif record not found!'
    );
  }

  const userName = `${userKif.firstName || ''} ${
    userKif.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_kif',
      'First name or last name is missing in UserKif!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',
      'User already exists with this email!'
    );
  }

  const existingKifUser = await User.findOne({ createdFromKifId });
  if (existingKifUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'kif_id_already_used',
      'This KIF ID is already associated with another user!'
    );
  }

  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const existingSanchCount = await User.countDocuments({
    sanchAreaId,
    role: 'sanchPramukh',
  });
  if (existingSanchCount >= 3) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_three_sanch_pramukh_from_single_sanch_area_allowed',
      'Only three Sanch Pramukh entries can be created for a single Sanch Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    sanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    createdFromKifId,
    sanchAreaFromUser,
    role: 'sanchPramukh',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sanch Pramukh.

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      sanchAreaId: newUser.sanchAreaId,
      createdFromKifId: newUser.createdFromKifId,
      sanchName: sanchDoc.sanchName,
    },
    token,
    message:
      'Sanch Pramukh registered successfully! Temporary password sent to email.',
  });
});

export const getTemporaryPasswordsSanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'sanchPramukh' })
      .select('temporaryPassword temporaryPasswordExpiresAt')
      .populate('userName', 'userName')
      .populate('role', 'role')
      .populate('sanchAreaFromUser', 'sanchAreaFromUser')
      .populate('svpEmail', 'svpEmail');
    if (!users.length) {
      return notFoundResponse(res, 'No Sanch Pramukh found!');
    }
    return successResponseWithData(
      res,
      'Temporary password information for all Sanch Pramukh fetched successfully!',
      users
    );
  }
);

export const createUpsanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const { svpEmail, upSanchAreaId, createdFromKifId } = req.body;

    if (!svpEmail || !upSanchAreaId || !createdFromKifId) {
      return validationErrorWithData(
        res,
        'missing_credentials',
        'Please provide all required fields!'
      );
    }

    const userKif = await UserKif.findById(createdFromKifId);
    if (!userKif) {
      return ErrorBadRequestResponseWithData(
        res,
        'userkif_not_found',

        'Associated UserKif record not found!'
      );
    }

    const userName = `${userKif.firstName || ''} ${
      userKif.lastName || ''
    }`.trim();

    if (!userName) {
      return ErrorBadRequestResponseWithData(
        res,
        'firstlast_name_missing_kif',

        'First name or last name is missing in UserKif!'
      );
    }

    const existingUser = await User.findOne({ svpEmail });
    if (existingUser) {
      return ErrorBadRequestResponseWithData(
        res,
        'user_already_exist',

        'User already exists with this email!'
      );
    }

    const existingKifUser = await User.findOne({ createdFromKifId });
    if (existingKifUser) {
      return ErrorBadRequestResponseWithData(
        res,
        'kif_id_already_used',
        'This KIF ID is already associated with another user!'
      );
    }

    const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
    if (!upsanchDoc) {
      return ErrorBadRequestResponseWithData(
        res,
        'upsanch_area_not_found',
        'Specified Upsanch area not found!'
      );
    }
    const existingupsanchCount = await User.countDocuments({
      upSanchAreaId,
      role: 'upSanchPramukh',
    });

    if (existingupsanchCount >= 3) {
      return ErrorBadRequestResponseWithData(
        res,
        'only_three_upsanch_pramukh_from_single_upsanch_area_allowed',
        'Only three Upsanch Pramukh entries can be created for a single Upsanch Area!'
      );
    }

    const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();

    if (!upSanchAreaFromUser) {
      return ErrorBadRequestResponseWithData(
        res,
        'upsanchname_missing_upsanch_area',

        'Upsanch Name is missing from Upsanch Area!'
      );
    }

    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

    const newUser = await User.create({
      userName,
      svpEmail,
      password: hashedPassword,
      upSanchAreaId,
      isPasswordChanged: false,
      temporaryPassword,
      temporaryPasswordExpiresAt: expirationTime,
      createdFromKifId,
      upSanchAreaFromUser,
      role: 'upSanchPramukh',
    });

    const token = newUser.getJWTToken();

    const emailOptions = {
      to: svpEmail,
      subject: 'Welcome to SVP - Your Temporary Password',
      text: `
      Hello ${userName},

      Your account has been successfully created as Sanch Pramukh.

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
    };

    try {
      await sendEmail(emailOptions);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return next(
        new ErrorHandler(
          'User registered, but there was an issue sending the email.',
          500
        )
      );
    }

    res.status(201).json({
      user: {
        _id: newUser._id,
        userName: newUser.userName,
        svpEmail: newUser.svpEmail,
        role: newUser.role,
        upSanchAreaId: newUser.upSanchAreaId,
        createdFromKifId: newUser.createdFromKifId,
        upSanchName: upsanchDoc.upSanchName,
      },
      token,
      message:
        'Upsanch Pramukh registered successfully! Temporary password sent to email.',
    });
  }
);
//!gs members
export const createGsMemberPradhan = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberPradhanId,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberPradhanId
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberPradhanId);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_pradhan_not_found_memberId',
      'Associated Gram Samiti Member Pradhan record not found!'
    );
  }

  if (gsInfoForm.designationInSvpGramSamii !== 'Pradhan') {
    return ErrorBadRequestResponseWithData(
      res,
      'invalid_designation_in_gram_samiti',
      'The selected member must have a designation of Pradhan in Gram Samiti!'
    );
  }

  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_gsInfoForm_memberId_pradhan',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Pradhan already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberPradhanId });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_pradhan_already_used',
      'This Gram Samiti Pradhan is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingPradhanCount = await User.countDocuments({
    upSanchAreaId,
    role: 'pradhan',
  });

  if (existingPradhanCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_Pradhan_from_single_upsanch_area_allowed',
      'Only 12 (Pradhan) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberPradhanId,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'pradhan',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Pradhan

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberPradhanId: newUser.gsMemberPradhanId,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Pradhan registered successfully! Temporary password sent to email.',
  });
});
export const createGsMemberUppradhan = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberUppradhanId,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberUppradhanId
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberUppradhanId);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_uppradhan_not_found_memberId',

      'Associated Gram Samiti Member Up-Pradhan record not found!'
    );
  }

    if (gsInfoForm.designationInSvpGramSamii !== 'Uppradhan') {
      return ErrorBadRequestResponseWithData(
        res,
        'invalid_designation_in_gram_samiti',
        'The selected member must have a designation of Up-Pradhan in Gram Samiti!'
      );
    }

  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_gsInfoForm_memberId_uppradhan',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Up-Pradhan already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberUppradhanId });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_uppradhan_already_used',
      'This Gram Samiti Up-Pradhan is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingUppradhanCount = await User.countDocuments({
    upSanchAreaId,
    role: 'uppradhan',
  });

  if (existingUppradhanCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_up-Pradhan_from_single_upsanch_area_allowed',
      'Only 12 (Up-Pradhan) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberUppradhanId,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'uppradhan',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Up-Pradhan

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberUppradhanId: newUser.gsMemberUppradhanId,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Up-Pradhan registered successfully! Temporary password sent to email.',
  });
});

export const createGsMemberSachiv = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberSachivId,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberSachivId
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberSachivId);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_sachiv_not_found_memberId',

      'Associated Gram Samiti Member Sachiv record not found!'
    );
  }

  if (gsInfoForm.designationInSvpGramSamii !== 'Sachiv') {
    return ErrorBadRequestResponseWithData(
      res,
      'invalid_designation_in_gram_samiti',
      'The selected member must have a designation of Sachiv in Gram Samiti!'
    );
  }

  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_gsInfoForm_memberId_sachiv',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Sachiv already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberSachivId });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_sachiv_already_used',
      'This Gram Samiti Sachiv is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingSachivCount = await User.countDocuments({
    upSanchAreaId,
    role: 'sachiv',
  });

  if (existingSachivCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_sachiv_from_single_upsanch_area_allowed',
      'Only 12 (Sachiv) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberSachivId,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'sachiv',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sachiv

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberSachivId: newUser.gsMemberSachivId,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Sachiv registered successfully! Temporary password sent to email.',
  });
});
export const createGsMemberUpsachiv = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberUpsachivId,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberUpsachivId
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberUpsachivId);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_upsachiv_not_found_memberId',

      'Associated Gram Samiti Member Up-Sachiv record not found!'
    );
  }

    if (gsInfoForm.designationInSvpGramSamii !== 'Upsachiv') {
      return ErrorBadRequestResponseWithData(
        res,
        'invalid_designation_in_gram_samiti',
        'The selected member must have a designation of Up-Sachiv in Gram Samiti!'
      );
    }


  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_gsInfoForm_memberId_upsachiv',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Up-Sachiv already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberUpsachivId });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_upsachiv_already_used',
      'This Gram Samiti Up-Sachiv is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingUpsachivCount = await User.countDocuments({
    upSanchAreaId,
    role: 'upsachiv',
  });

  if (existingUpsachivCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_upsachiv_from_single_upsanch_area_allowed',
      'Only 12 (Up-Sachiv) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberUpsachivId,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'upsachiv',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Up-Sachiv

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberUpsachivId: newUser.gsMemberUpsachivId,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Up-Sachiv registered successfully! Temporary password sent to email.',
  });
});
export const createGsMemberSadasya1 = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberSadasya1Id,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberSadasya1Id
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberSadasya1Id);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'Sadasya gsInfoForm_memberId_sadasya1_not_found_memberId',

      'Associated Gram Samiti Member Sadasya 1 record not found!'
    );
  }
    if (gsInfoForm.designationInSvpGramSamii !== 'Sadasya1') {
      return ErrorBadRequestResponseWithData(
        res,
        'invalid_designation_in_gram_samiti',
        'The selected member must have a designation of (Sadasya1) in Gram Samiti!'
      );
    }

  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_sadasya1 ',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Sadasya 1 already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberSadasya1Id });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_sadasya1_already_used',
      'This Gram Samiti Sadasya 1 is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingAacharyaCount = await User.countDocuments({
    upSanchAreaId,
    role: 'sadasya1',
  });

  if (existingAacharyaCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_sadasya 1_from_single_upsanch_area_allowed',
      'Only 12 (Sadasya 1) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberSadasya1Id,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'sadasya1',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sadasya 1

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberSadasya1Id: newUser.gsMemberSadasya1Id,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Sadasya 1 registered successfully! Temporary password sent to email.',
  });
});
export const createGsMemberSadasya2 = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberSadasya2Id,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberSadasya2Id
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberSadasya2Id);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_sadasya2_not_found_memberId',

      'Associated Gram Samiti Member Sadasya 2 record not found!'
    );
  }

      if (gsInfoForm.designationInSvpGramSamii !== 'Sadasya2') {
        return ErrorBadRequestResponseWithData(
          res,
          'invalid_designation_in_gram_samiti',
          'The selected member must have a designation of (Sadasya2) in Gram Samiti!'
        );
      }


  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_Sadasya2 ',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Sadasya 2 already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberSadasya2Id });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'Sadasya gsInfoForm_memberId_sadasya2_already_used',
      'This Gram Samiti Sadasya 2 is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingAacharyaCount = await User.countDocuments({
    upSanchAreaId,
    role: 'sadasya2',
  });

  if (existingAacharyaCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_sadasya_2_from_single_upsanch_area_allowed',
      'Only 12 (Sadasya 2) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberSadasya2Id,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'sadasya2',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sadasya 2

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberSadasya2Id: newUser.gsMemberSadasya2Id,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Sadasya 2 registered successfully! Temporary password sent to email.',
  });
});
export const createGsMemberSadasya3 = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    gsMemberSadasya3Id,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !gsMemberSadasya3Id
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const gsInfoForm = await GramSamitiInfo.findById(gsMemberSadasya3Id);
  if (!gsInfoForm) {
    return ErrorBadRequestResponseWithData(
      res,
      'gsInfoForm_memberId_sadasya_3_not_found_memberId',

      'Associated Gram Samiti Member Sadasya 3 record not found!'
    );
  }

      if (gsInfoForm.designationInSvpGramSamii !== 'Sadasya3') {
        return ErrorBadRequestResponseWithData(
          res,
          'invalid_designation_in_gram_samiti',
          'The selected member must have a designation of (Sadasya3) in Gram Samiti!'
        );
      }

  const userName = `${gsInfoForm.firstName || ''} ${
    gsInfoForm.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_Sadasya_3 ',

      'First name or last name is missing in Gram Samiti Info Form!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'Gram Samiti Sadasya 3 already exists with this email!'
    );
  }

  const existingGsInfoMember = await User.findOne({ gsMemberSadasya3Id });
  if (existingGsInfoMember) {
    return ErrorBadRequestResponseWithData(
      res,
      'Sadasya gsInfoForm_memberId_sadasya3_already_used',
      'This Gram Samiti Sadasya 3 is already associated with another Gram Samiti!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingAacharyaCount = await User.countDocuments({
    upSanchAreaId,
    role: 'sadasya3',
  });

  if (existingAacharyaCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_1_sadasya_3_from_single_upsanch_area_allowed',
      'Only 12 (Sadasya 3) entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    gsMemberSadasya3Id,

    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'sadasya3',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Sadasya 3

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      gsMemberSadasya3Id: newUser.gsMemberSadasya3Id,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Gram Samiti Sadasya 3 registered successfully! Temporary password sent to email.',
  });
});


export const createAacharya = asyncErrorHandler(async (req, res, next) => {
  const {
    svpEmail,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    createdFromAacharyaKifId,
  } = req.body;

  if (
    !svpEmail ||
    !anchalAreaId ||
    !sankulAreaId ||
    !sanchAreaId ||
    !upSanchAreaId ||
    !createdFromAacharyaKifId
  ) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide all required fields!'
    );
  }

  const userKif = await Form.findById(createdFromAacharyaKifId);
  if (!userKif) {
    return ErrorBadRequestResponseWithData(
      res,
      'userkif_not_found',

      'Associated UserKif record not found!'
    );
  }

  const userName = `${userKif.firstName || ''} ${
    userKif.lastName || ''
  }`.trim();

  if (!userName) {
    return ErrorBadRequestResponseWithData(
      res,
      'firstlast_name_missing_kif',

      'First name or last name is missing in UserKif!'
    );
  }

  const existingUser = await User.findOne({ svpEmail });
  if (existingUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'user_already_exist',

      'User already exists with this email!'
    );
  }

  const existingKifUser = await User.findOne({ createdFromAacharyaKifId });
  if (existingKifUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'kif_id_already_used',
      'This KIF ID is already associated with another user!'
    );
  }

  const anchalDoc = await AnchalAreaNew.findById(anchalAreaId);
  if (!anchalDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_area_not_found',
      'Specified Anchal area not found!'
    );
  }
  const sankulDoc = await SankulAreaNew.findById(sankulAreaId);
  if (!sankulDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_area_not_found',
      'Specified Sankul area not found!'
    );
  }
  const sanchDoc = await SanchAreaNew.findById(sanchAreaId);
  if (!sanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_area_not_found',
      'Specified Sanch area not found!'
    );
  }

  const upsanchDoc = await UpSanchAreaNew.findById(upSanchAreaId);
  if (!upsanchDoc) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_area_not_found',
      'Specified Upsanch area not found!'
    );
  }

  const existingAacharyaCount = await User.countDocuments({
    upSanchAreaId,
    role: 'aacharya',
  });

  if (existingAacharyaCount >= 12) {
    return ErrorBadRequestResponseWithData(
      res,
      'only_12_Aacharya_from_single_upsanch_area_allowed',
      'Only 12 Aacharya entries can be created for a single Upsanch Area!'
    );
  }

  const anchalAreaFromUser = anchalDoc.anchalName?.trim();

  if (!anchalAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_missing_anchal_area',

      'Anchal Name is missing from Anchal Area!'
    );
  }

  const sankulAreaFromUser = sankulDoc.sankulName?.trim();

  if (!sankulAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankulname_missing_sankul_area',
      'Sankul Name is missing from Sankul Area!'
    );
  }

  const sanchAreaFromUser = sanchDoc.sanchName?.trim();

  if (!sanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanchname_missing_sanch_area',
      'Sanch Name is missing from Sanch Area!'
    );
  }

  const upSanchAreaFromUser = upsanchDoc.upSanchName?.trim();
  if (!upSanchAreaFromUser) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanchname_missing_upsanch_area',

      'Upsanch Name is missing from Upsanch Area!'
    );
  }

  const temporaryPassword = crypto.randomBytes(4).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

  const expirationTime = Date.now() + 12 * 60 * 60 * 1000;

  const newUser = await User.create({
    userName,
    svpEmail,
    password: hashedPassword,
    anchalAreaId,
    sankulAreaId,
    sanchAreaId,
    upSanchAreaId,
    isPasswordChanged: false,
    temporaryPassword,
    temporaryPasswordExpiresAt: expirationTime,
    createdFromAacharyaKifId,
    anchalAreaFromUser,
    sankulAreaFromUser,
    sanchAreaFromUser,
    upSanchAreaFromUser,
    role: 'aacharya',
  });

  const token = newUser.getJWTToken();

  const emailOptions = {
    to: svpEmail,
    subject: 'Welcome to SVP - Your Temporary Password',
    text: `
      Hello ${userName},

      Your account has been successfully created as Aacharya

      Login Details:
        Email: ${svpEmail}
        Temporary Password: ${temporaryPassword}

      Please log in and change your password immediately for security purposes. Your temporary password will expire in **12 hours**.

      Best regards,
      SVP Team
    `,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return next(
      new ErrorHandler(
        'User registered, but there was an issue sending the email.',
        500
      )
    );
  }

  res.status(201).json({
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      svpEmail: newUser.svpEmail,
      role: newUser.role,
      anchalAreaId: newUser.anchalAreaId,
      sankulAreaId: newUser.sankulAreaId,
      sanchAreaId: newUser.sanchAreaId,
      upSanchAreaId: newUser.upSanchAreaId,
      createdFromAacharyaKifId: newUser.createdFromAacharyaKifId,
      anchalName: anchalDoc.anchalName,
      sankulName: sankulDoc.sankulName,
      sanchName: sanchDoc.sanchName,
      upSanchName: upsanchDoc.upSanchName,
    },
    token,
    message:
      'Aacharya registered successfully! Temporary password sent to email.',
  });
});

export const getAacharyaCount = asyncErrorHandler(async (req, res, next) => {
  const { areaType, areaId } = req.query;

  // Validate request parameters
  if (!areaType) {
    return validationErrorWithData(
      res,
      'missing_area_type',
      'Please provide an area type (anchal, sankul, sanch, or upsanch)'
    );
  }

  let query = { role: 'aacharya' };
  let areaName = '';

  // Check if areaId is valid ObjectId if provided
  if (areaId && !mongoose.Types.ObjectId.isValid(areaId)) {
    return ErrorBadRequestResponseWithData(
      res,
      'invalid_area_id',
      'The provided area ID is not valid'
    );
  }

  // Build query based on area type
  switch (areaType.toLowerCase()) {
    case 'anchal':
      if (areaId) {
        query.anchalAreaId = areaId;
        try {
          const anchalDoc = await AnchalAreaNew.findById(areaId);
          if (!anchalDoc) {
            return ErrorBadRequestResponseWithData(
              res,
              'anchal_area_not_found',
              'Specified Anchal area not found!'
            );
          }
          areaName = anchalDoc.anchalName || '';
        } catch (error) {
          return ErrorBadRequestResponseWithData(
            res,
            'database_error',
            'Error retrieving area information'
          );
        }
      }
      break;
    case 'sankul':
      if (areaId) {
        query.sankulAreaId = areaId;
        try {
          const sankulDoc = await SankulAreaNew.findById(areaId);
          if (!sankulDoc) {
            return ErrorBadRequestResponseWithData(
              res,
              'sankul_area_not_found',
              'Specified Sankul area not found!'
            );
          }
          areaName = sankulDoc.sankulName || '';
        } catch (error) {
          return ErrorBadRequestResponseWithData(
            res,
            'database_error',
            'Error retrieving area information'
          );
        }
      }
      break;
    case 'sanch':
      if (areaId) {
        query.sanchAreaId = areaId;
        try {
          const sanchDoc = await SanchAreaNew.findById(areaId);
          if (!sanchDoc) {
            return ErrorBadRequestResponseWithData(
              res,
              'sanch_area_not_found',
              'Specified Sanch area not found!'
            );
          }
          areaName = sanchDoc.sanchName || '';
        } catch (error) {
          return ErrorBadRequestResponseWithData(
            res,
            'database_error',
            'Error retrieving area information'
          );
        }
      }
      break;
    case 'upsanch':
      if (areaId) {
        query.upSanchAreaId = areaId;
        try {
          const upsanchDoc = await UpSanchAreaNew.findById(areaId);
          if (!upsanchDoc) {
            return ErrorBadRequestResponseWithData(
              res,
              'upsanch_area_not_found',
              'Specified Upsanch area not found!'
            );
          }
          areaName = upsanchDoc.upSanchName || '';
        } catch (error) {
          return ErrorBadRequestResponseWithData(
            res,
            'database_error',
            'Error retrieving area information'
          );
        }
      }
      break;
    default:
      return validationErrorWithData(
        res,
        'invalid_area_type',
        'Area type must be one of: anchal, sankul, sanch, or upsanch'
      );
  }

  // Count Aacharyas based on the query
  try {
    const count = await User.countDocuments(query);

    // If specific area was requested, include area info in response
    if (areaId && areaName) {
      return res.status(200).json({
        success: true,
        count,
        areaType: areaType.toLowerCase(),
        areaId,
        areaName,
        message: `Found ${count} Aacharyas in ${areaType} "${areaName}"`
      });
    }

    // Otherwise return total count for the area type
    return res.status(200).json({
      success: true,
      count,
      areaType: areaType.toLowerCase(),
      message: `Found ${count} total Aacharyas${areaId ? ' matching criteria' : ''}`
    });
  } catch (error) {
    console.error('Error counting Aacharyas:', error);
    return ErrorInternalServerResponseWithData(
      res,
      'count_operation_failed',
      'Failed to count Aacharyas'
    );
  }
});

// Controller to get Aacharya distribution across all areas
export const getAacharyaDistribution = asyncErrorHandler(async (req, res, next) => {
  const { areaType } = req.query;

  if (!areaType) {
    return validationErrorWithData(
      res,
      'missing_area_type',
      'Please provide an area type (anchal, sankul, sanch, or upsanch)'
    );
  }

  let distributionData = [];
  let areaModel;
  let areaField;
  let nameField;

  // Set up area model and field names based on area type
  switch (areaType.toLowerCase()) {
    case 'anchal':
      areaModel = AnchalAreaNew;
      areaField = 'anchalAreaId';
      nameField = 'anchalName';
      break;
    case 'sankul':
      areaModel = SankulAreaNew;
      areaField = 'sankulAreaId';
      nameField = 'sankulName';
      break;
    case 'sanch':
      areaModel = SanchAreaNew;
      areaField = 'sanchAreaId';
      nameField = 'sanchName';
      break;
    case 'upsanch':
      areaModel = UpSanchAreaNew;
      areaField = 'upSanchAreaId';
      nameField = 'upSanchName';
      break;
    default:
      return validationErrorWithData(
        res,
        'invalid_area_type',
        'Area type must be one of: anchal, sankul, sanch, or upsanch'
      );
  }

  try {
    // Get all areas of the specified type
    const areas = await areaModel.find();

    // For each area, count the Aacharyas
    for (const area of areas) {
      if (!area || !area._id) continue; // Skip if area or area._id is null/undefined
      
      const query = { role: 'aacharya', [areaField]: area._id };
      try {
        const count = await User.countDocuments(query);
        
        distributionData.push({
          areaId: area._id,
          areaName: area[nameField] || 'Unnamed Area',
          count
        });
      } catch (countError) {
        console.error(`Error counting Aacharyas for area ${area._id}:`, countError);
        // Continue with next area instead of failing completely
      }
    }

    // Sort by count (descending)
    distributionData.sort((a, b) => b.count - a.count);

    // Calculate total
    const totalCount = distributionData.reduce((sum, area) => sum + area.count, 0);

    return res.status(200).json({
      success: true,
      totalCount,
      areaType: areaType.toLowerCase(),
      distribution: distributionData,
      message: `Found distribution of ${totalCount} Aacharyas across ${distributionData.length} ${areaType} areas`
    });
  } catch (error) {
    console.error('Error retrieving Aacharya distribution:', error);
    return ErrorInternalServerResponseWithData(
      res,
      'distribution_operation_failed',
      'Failed to retrieve Aacharya distribution'
    );
  }
});


//!get aachrya
export const getAacharyaDetails = asyncErrorHandler(async (req, res, next) => {
  const aacharyaId = req.params.id;

  if (!aacharyaId) {
    return ErrorBadRequestResponseWithData(
      res,
      'missing_id',
      'Please provide the Aacharya ID!'
    );
  }

  const aacharya = await User.findById(aacharyaId).populate([
    { path: 'anchalAreaId', select: 'anchalName' },
    { path: 'sankulAreaId', select: 'sankulName' },
    { path: 'sanchAreaId', select: 'sanchName' },
    { path: 'upSanchAreaId', select: 'upSanchName' },
  ]);

  if (!aacharya || aacharya.role !== 'aacharya') {
    return ErrorBadRequestResponseWithData(
      res,
      'aacharya_not_found',
      'Aacharya not found or invalid role!'
    );
  }

  const response = {
    _id: aacharya._id,
    userName: aacharya.userName,
    svpEmail: aacharya.svpEmail,
    role: aacharya.role,
    anchalAreaId: aacharya.anchalAreaId,
    anchalName: aacharya.anchalAreaId?.anchalName,
    sankulAreaId: aacharya.sankulAreaId,
    sankulName: aacharya.sankulAreaId?.sankulName,
    sanchAreaId: aacharya.sanchAreaId,
    sanchName: aacharya.sanchAreaId?.sanchName,
    upSanchAreaId: aacharya.upSanchAreaId,
    upSanchName: aacharya.upSanchAreaId?.upSanchName,
    createdFromAacharyaKifId: aacharya.createdFromAacharyaKifId,
  };

  successResponseWithData(res, 'aacharya_fetched', response, 200);
});


export const getAllAacharyas = asyncErrorHandler(async (req, res, next) => {
  const aacharyas = await User.find({ role: 'aacharya' }).populate([
    { path: 'anchalAreaId', select: 'anchalName' },
    { path: 'sankulAreaId', select: 'sankulName' },
    { path: 'sanchAreaId', select: 'sanchName' },
    { path: 'upSanchAreaId', select: 'upSanchName' },
  ]);

  if (!aacharyas || aacharyas.length === 0) {
    return successResponseWithData(res, 'no_aacharyas_found', [], 200);
  }

  const response = aacharyas.map((aacharya) => ({
    _id: aacharya._id,
    userName: aacharya.userName,
    svpEmail: aacharya.svpEmail,
    role: aacharya.role,
    anchalAreaId: aacharya.anchalAreaId,
    anchalName: aacharya.anchalAreaId?.anchalName,
    sankulAreaId: aacharya.sankulAreaId,
    sankulName: aacharya.sankulAreaId?.sankulName,
    sanchAreaId: aacharya.sanchAreaId,
    sanchName: aacharya.sanchAreaId?.sanchName,
    upSanchAreaId: aacharya.upSanchAreaId,
    upSanchName: aacharya.upSanchAreaId?.upSanchName,
    createdFromAacharyaKifId: aacharya.createdFromAacharyaKifId,
  }));

  successResponseWithData(res, 'aacharyas_fetched', response, 200);
});


export const getTemporaryPasswordsUpanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'upSanchPramukh' })
      .select('temporaryPassword temporaryPasswordExpiresAt')
      .populate('userName', 'userName')
      .populate('role', 'role')
      .populate('upSanchAreaFromUser', 'upSanchAreaFromUser')
      .populate('svpEmail', 'svpEmail');
    if (!users.length) {
      return notFoundResponse(res, 'No Upsanch Pramukh found!');
    }
    return successResponseWithData(
      res,
      'Temporary password information for all Upsanch Pramukh fetched successfully!',
      users
    );
  }
);
export const getTemporaryPasswordsAacharya = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'aacharya' })
      .select('temporaryPassword temporaryPasswordExpiresAt')
      .populate('userName', 'userName')
      .populate('role', 'role')
      .populate('anchalAreaFromUser', 'anchalAreaFromUser')
      .populate('sankulAreaFromUser', 'sankulAreaFromUser')
      .populate('sanchAreaFromUser', 'sanchAreaFromUser')
      .populate('upSanchAreaFromUser', 'upSanchAreaFromUser')
      .populate('svpEmail', 'svpEmail');
    if (!users.length) {
      return notFoundResponse(res, 'No Aacharya found!');
    }
    return successResponseWithData(
      res,
      'Temporary password information for all Aacharya fetched successfully!',
      users
    );
  }
);


export const loginSysAdNSvpRoleAll = asyncErrorHandler(
  async (req, res, next) => {
    const { svpEmail, password } = req.body;

    if (!svpEmail || !password) {
      return validationErrorWithData(
        res,
        'missing_credentials',
        'Please provide both email and password to login!'
      );
    }

    
    const user = await User.findOne({ svpEmail }).select(
      '+password +isPasswordChanged +temporaryPassword +temporaryPasswordExpiresAt'
    );

    if (!user) {
      return validationErrorWithData(
        res,
        'invalid_email_or_password',
        'Invalid email or password!'
      );
    }

    if (user.isDeleted) {
      return validationErrorWithData(
        res,
        'systemAdmin_account_deleted',
        'This account has been deleted!'
      );
    }

    const cleanPassword = password.trim();

    
    const isTemporaryPassword =
      user.temporaryPassword && user.temporaryPassword === cleanPassword;
    const isTemporaryPasswordExpired =
      user.temporaryPasswordExpiresAt &&
      user.temporaryPasswordExpiresAt < Date.now();

    let authenticated = false;

   
    if (isTemporaryPassword) {
      if (isTemporaryPasswordExpired) {
        return validationErrorWithData(
          res,
          'temp_password_expired',
          'Your temporary password has expired. Please reset your password using the Forgot Password.'
        );
      }
      authenticated = true;
    }
  
    else {
      if (!user.password) {
        return validationErrorWithData(
          res,
          'invalid_credentials',
          'Invalid credentials. Please try again.'
        );
      }

      try {
    
        const isMatch = await bcrypt.compare(cleanPassword, user.password);

        if (isMatch) {
          authenticated = true;
        } else {
          console.log('Password comparison failed');
        }
      } catch (error) {
        return validationErrorWithData(
          res,
          'auth_error',
          'Authentication error occurred. Please try again.'
        );
      }
    }

    if (!authenticated) {
      return validationErrorWithData(
        res,
        'incorrect_password',
        'Incorrect password. Please try again.'
      );
    }

    sendToken('User Logged In !', user, res, 200);
  }
);

export const changePasswordSysAdNSvpRoleAll = asyncErrorHandler(
  async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return validationErrorWithData(
        res,
        'missing_credentials',
        'Please provide all password fields!'
      );
    }

    if (newPassword !== confirmPassword) {
      return validationErrorWithData(
        res,
        'newpass_confirmpass_not_matched',
        'New password and confirm password do not match!'
      );
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      return validationErrorWithData(
        res,
        'new_pass_8_16_char',
        'New password must be between 8 and 16 characters!'
      );
    }

    
    const user = await User.findById(req.user.id).select(
      '+password +isPasswordChanged +temporaryPassword +temporaryPasswordExpiresAt'
    );

    if (!user) {
      return next(new ErrorHandler('User not found!', 404));
    }

    

    // Check if user is using temporary password or regular password
    const isUsingTemporaryPassword = 
      user.temporaryPassword && user.temporaryPassword === currentPassword;
    
    let currentPasswordVerified = false;
    
    // If using temporary password, check if it's expired
    if (isUsingTemporaryPassword) {
   
      if (user.temporaryPasswordExpiresAt && user.temporaryPasswordExpiresAt < Date.now()) {
        return validationErrorWithData(
          res,
          'temp_pass_expired',
          'Your temporary password has expired. Please request a new one.'
        );
      }
      currentPasswordVerified = true;
    } 
    // If using regular password, verify it matches
    else {
    
      if (!user.password) {
        return validationErrorWithData(
          res,
          'invalid_credentials',
          'Invalid credentials. Please try again.'
        );
      }
      
      try {
        const cleanCurrentPassword = currentPassword.trim();
        const isMatch = await bcrypt.compare(cleanCurrentPassword, user.password);
       
        
        if (isMatch) {
          currentPasswordVerified = true;
        }
      } catch (error) {
     
        return validationErrorWithData(
          res,
          'auth_error',
          'Authentication error occurred. Please try again.'
        );
      }
    }

    if (!currentPasswordVerified) {
      return validationErrorWithData(
        res,
        'current_pass_incorrect',
        'Current password is incorrect!'
      );
    }

    try {
      // Generate salt and hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
      
     
      
      // Use findByIdAndUpdate for atomic update
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          password: hashedPassword,
          isPasswordChanged: true,
          $unset: { 
            temporaryPassword: "", 
            temporaryPasswordExpiresAt: "" 
          }
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
      
        return next(new ErrorHandler('Failed to update password', 500));
      }
      
      // Verify the update succeeded by retrieving the user again
      const verifyUser = await User.findById(user._id).select('+password');
      
      
      if (verifyUser.password !== hashedPassword) {
        
        return next(new ErrorHandler('Password update verification failed', 500));
      }
      
     

      return successResponseWithData(
        res,
        'pass_change_success',
        'Password changed successfully! You can now log in with your new password.'
      );
    } catch (error) {
    
      return next(new ErrorHandler('Failed to update password', 500));
    }
  }
);


export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail } = req.body;

  if (!svpEmail) {
    return validationErrorWithData(
      res,
      'missing_credentials',
      'Please provide SVP  email !'
    );
  }

  const user = await User.findOne({ svpEmail }).select('+otp +otpExpires');

  if (!user) {
    return validationErrorWithData(
      res,
      'invalid_role_svpEmail',
      'No User found with this email!'
    );
  }

  if (user.isDeleted) {
    return validationErrorWithData(
      res,
      'account_deleted',
      'This account has been deleted!'
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = Date.now() + 5 * 60 * 1000;

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  const emailOptions = {
    to: user.svpEmail,
    subject: 'Password Reset OTP',
    text: `Hello ${user.name},\n\nYour OTP to reset your password is ${otp}. It will expire in 5 minutes.\n\nBest regards,\nSVP Team`,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending OTP email:', emailError);
    return next(
      new ErrorHandler(
        'OTP generated, but there was an issue sending the email.',
        500
      )
    );
  }

  return successResponseWithData(
    res,
    'OTP sent successfully! Please check your email.'
  );
});

export const resetPassword = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail, otp, newPassword, confirmPassword } = req.body;

  if (!svpEmail || !otp || !newPassword || !confirmPassword) {
    return validationErrorWithData(
      res,
      'missing_fields',
      'All fields (SVP email, OTP, and passwords) are required!'
    );
  }
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (!isValidEmail(svpEmail)) {
    return validationErrorWithData(
      res,
      'invalid_email',
      'Please provide a valid email address!'
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    return validationErrorWithData(
      res,
      'invalid_otp_format',
      'OTP must be a six-digit number!'
    );
  }

  if (newPassword !== confirmPassword) {
    return validationErrorWithData(
      res,
      'password_mismatch',
      'New password and confirm password do not match!'
    );
  }

  const passwordComplexityRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

  if (!passwordComplexityRegex.test(newPassword)) {
    return validationErrorWithData(
      res,
      'password_complexity',
      'Password must include at least one uppercase letter, one number, and one special character.'
    );
  }

  const user = await User.findOne({ svpEmail }).select(
    '+otp +otpExpiresAt +password'
  );

  if (!user) {
    return validationErrorWithData(res, 'user_not_found', 'User not found!');
  }

  if (user.otp !== otp) {
    return validationErrorWithData(
      res,
      'invalid_otp',
      'Invalid OTP! Please check the code and try again.'
    );
  }

  if (user.otpExpiresAt < Date.now()) {
    return validationErrorWithData(
      res,
      'otp_expired',
      'OTP has expired! Please request a new one.'
    );
  }

  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(newPassword, salt);

  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return successResponseWithData(
    res,
    'password_reset_successful',

    'Password reset successful! You can now log in with your new password.'
  );
});

export const resendOtp = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail } = req.body;

  if (!svpEmail) {
    return validationErrorWithData(
      res,
      'provide_email',

      'Please provide an email address!'
    );
  }

  const user = await User.findOne({ svpEmail }).select('+otp +otpExpiresAt');

  if (!user) {
    return validationErrorWithData(
      res,
      'user_not_found',

      'User not found!'
    );
  }

  if (user.otpExpiresAt > Date.now()) {
    return validationErrorWithData(
      res,
      'OTP_still_valid',

      'OTP is still valid. Please use the current OTP.'
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiresAt = Date.now() + 5 * 60 * 1000;

  user.otp = otp;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  const emailOptions = {
    to: user.svpEmail,
    subject: 'Password Reset OTP',
    text: `Hello ${user.name},\n\nYour new OTP to reset your password is ${otp}. It will expire in 5 minutes.\n\nBest regards,\nSVP Team`,
  };

  try {
    await sendEmail(emailOptions);
  } catch (emailError) {
    console.error('Error sending OTP email:', emailError);
    return next(
      new ErrorHandler(
        'OTP_send_but_error_email',

        'OTP sent, but there was an issue sending the email.',
        500
      )
    );
  }

  return successResponseWithData(
    res,
    'new_OTP_send',

    'New OTP sent successfully! Please check your email.'
  );
});

export const updateFcmToken = asyncErrorHandler(async (req, res, next) => {
  const { fcmToken } = req.body;
  const userId = req.user.id;

  if (!fcmToken) {
    return validationErrorWithData(res, 'FCM token is required');
  }

  // Log the token being saved for debugging
  console.log(`Updating FCM token for user ${userId}: ${fcmToken.substring(0, 10)}...`);

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { fcmToken: fcmToken } }, // Using $set operator to ensure it updates
      { new: true, runValidators: true }
    );

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Verify token was saved
    console.log(`FCM token updated successfully for user ${userId}`);
    
    return successResponseWithData(res, 'FCM token updated successfully!', {
      userId: user._id,
      userName: user.userName,
      tokenUpdated: true
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return errorResponse(res, 'Error updating FCM token');
  }
});

export const verifyOTP = asyncErrorHandler(async (req, res, next) => {
  const { svpEmail, otp } = req.body;

  // Check if required fields are provided
  if (!svpEmail || !otp) {
    return validationErrorWithData(
      res,
      'missing_fields',
      'Both SVP email and OTP are required!'
    );
  }

  // Validate email format
  const isValidEmail = (email)=> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)

;
  };

  if (!isValidEmail(svpEmail)) {
    return validationErrorWithData(
      res,
      'invalid_email',
      'Please provide a valid email address!'
    );
  }

  // Validate OTP format
  if (!/^\d{6}$/.test(otp)) {
    return validationErrorWithData(
      res,
      'invalid_otp_format',
      'OTP must be a six-digit number!'
    );
  }

  // Find user by email
  const user = await User.findOne({ svpEmail }).select('+otp +otpExpiresAt');

  if (!user) {
    return validationErrorWithData(res, 'user_not_found', 'User not found!');
  }

  // Verify OTP
  if (user.otp !== otp) {
    return validationErrorWithData(
      res,
      'invalid_otp',
      'Invalid OTP! Please check the code and try again.'
    );
  }

  // Check if OTP is expired
  if (user.otpExpiresAt < Date.now()) {
    return validationErrorWithData(
      res,
      'otp_expired',
      'OTP has expired! Please request a new one.'
    );
  }

  // OTP is valid
  return successResponseWithData(
    res,
    'otp_verified',
    'OTP verification successful! You can now proceed with password reset.'
  );
});

// Add a function to verify FCM token for testing
export const verifyFcmToken = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId).select('+fcmToken');
  
  if (!user) {
    return notFoundResponse(res, 'User not found');
  }
  
  if (!user.fcmToken) {
    return validationErrorWithData(res, 'No FCM token found for this user');
  }
  
  return successResponseWithData(res, 'FCM token found', {
    userId: user._id,
    tokenExists: true,
    tokenPreview: user.fcmToken.substring(0, 10) + '...'
  });
});

export const deleteProfile = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return notFoundResponse(res, 'User not found!');
  }

  const roleMapping = {
    anchalPramukh: 'Anchal Pramukh',
    sankulPramukh: 'Sankul Pramukh',
    sanchPramukh: 'Sanch Pramukh',
    upSanchPramukh: 'Upsanch Pramukh',
    systemAdmin: 'System Admin',
  };

  const roleDisplayName = roleMapping[user.role] || 'User';

  user.isDeleted = true;
  user.deletedAt = Date.now();

  await user.save();

  // Role-specific success message
  const message = `Profile of ${roleDisplayName} soft deleted successfully!`;
  return successResponse(res, message);
});

export const recoverProfile = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select('+isDeleted');

  if (!user) {
    return notFoundResponse(res, 'User not found!');
  }

  if (!user.isDeleted) {
    return successResponse(res, 'Profile is not deleted!');
  }

  user.isDeleted = false;
  user.deletedAt = null;

  await user.save();
  return successResponse(res, 'Profile Recovered!');
});

export const getAllSystemAdmin = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find({ role: 'systemAdmin' });

  if (!users.length) {
    return notFoundResponse(res, 'System Admin not found!');
  }

  return successResponseWithData(
    res,
    'All System Admin data fetched successfully!',
    users
  );
});
export const getAllSuperAdmin = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find({ role: 'superAdmin' });

  if (!users.length) {
    return notFoundResponse(res, 'Super Admin not found!');
  }

  return successResponseWithData(
    res,
    'All Super Admin data fetched successfully!',
    users
  );
});

export const getAllAnchalPramukh = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find({ role: 'anchalPramukh' });

  if (!users.length) {
    return notFoundResponse(res, 'Anchal Pramukh not found!');
  }

  return successResponseWithData(
    res,
    'All Anchal Pramukh data fetched successfully!',
    users
  );
});

export const getAllSankulPramukh = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find({ role: 'sankulPramukh' });

  if (!users.length) {
    return notFoundResponse(res, 'Sankul Pramukh not found!');
  }

  return successResponseWithData(
    res,
    'All Sankul Pramukh data fetched successfully!',
    users
  );
});

export const getAllSanchPramukh = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find({ role: 'sanchPramukh' });

  if (!users.length) {
    return notFoundResponse(res, 'Sanch Pramukh not found!');
  }

  return successResponseWithData(
    res,
    'All Sanch Pramukh data fetched successfully!',
    users
  );
});

export const getAllUpsanchPramukh = asyncErrorHandler(
  async (req, res, next) => {
    const users = await User.find({ role: 'upSanchPramukh' });

    if (!users.length) {
      return notFoundResponse(res, 'Upsanch Pramukh not found!');
    }

    return successResponseWithData(
      res,
      'All Upsanch Pramukh data fetched successfully!',
      users
    );
  }
);


//! get gram samii members

export const getAllGsPradhan = asyncErrorHandler(async (req, res, next) => {
 
  const pradhans = await User.find({ role: 'pradhan' }).populate({
    path: 'gsMemberPradhanId',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!pradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Pradhan not found!');
  }


  const pradhanIds = pradhans
    .map((p) => p.gsMemberPradhanId?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberPradhanId: { $in: pradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberPradhanId'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberPradhanId) {
      gramSamitiMap[gs.gsMemberPradhanId.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = pradhans.map((pradhan) => {
    const pradhanId = pradhan.gsMemberPradhanId?._id.toString();
    const gsInfo = pradhanId ? gramSamitiMap[pradhanId] : null;

    return {
      _id: pradhan._id,
      userName: pradhan.userName,
      svpEmail: pradhan.svpEmail,
      role: pradhan.role,
      anchalAreaId: pradhan.anchalAreaId,
      sankulAreaId: pradhan.sankulAreaId,
      sanchAreaId: pradhan.sanchAreaId,
      upSanchAreaId: pradhan.upSanchAreaId,
      anchalAreaFromUser: pradhan.anchalAreaFromUser,
      sankulAreaFromUser: pradhan.sankulAreaFromUser,
      sanchAreaFromUser: pradhan.sanchAreaFromUser,
      upSanchAreaFromUser: pradhan.upSanchAreaFromUser,
      isTemporaryRole: pradhan.isTemporaryRole,
      createdAt: pradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: pradhan.gsMemberPradhanId
        ? {
            _id: pradhan.gsMemberPradhanId._id,
            firstName: pradhan.gsMemberPradhanId.firstName,
            middleName: pradhan.gsMemberPradhanId.middleName,
            lastName: pradhan.gsMemberPradhanId.lastName,
            contactNo: pradhan.gsMemberPradhanId.contactNo,
            emailId: pradhan.gsMemberPradhanId.emailId,
            designationInSvpGramSamii:
              pradhan.gsMemberPradhanId.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Pradhan data fetched successfully!',
    result
  );
});


export const getAllGsUppradhan = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'uppradhan' }).populate({
    path: 'gsMemberUppradhanId',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Up-Pradhan not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberUppradhanId?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberUppradhanId: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberUppradhanId'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberUppradhanId) {
      gramSamitiMap[gs.gsMemberUppradhanId.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberUppradhanId?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberUppradhanId
        ? {
            _id: uppradhan.gsMemberUppradhanId._id,
            firstName: uppradhan.gsMemberUppradhanId.firstName,
            middleName: uppradhan.gsMemberUppradhanId.middleName,
            lastName: uppradhan.gsMemberUppradhanId.lastName,
            contactNo: uppradhan.gsMemberUppradhanId.contactNo,
            emailId: uppradhan.gsMemberUppradhanId.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberUppradhanId.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Up-Pradhan data fetched successfully!',
    result
  );
});
export const getAllGsSachiv = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'sachiv' }).populate({
    path: 'gsMemberSachivId',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Sachiv not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberSachivId?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberSachivId: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberSachivId'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberSachivId) {
      gramSamitiMap[gs.gsMemberSachivId.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberSachivId?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberSachivId
        ? {
            _id: uppradhan.gsMemberSachivId._id,
            firstName: uppradhan.gsMemberSachivId.firstName,
            middleName: uppradhan.gsMemberSachivId.middleName,
            lastName: uppradhan.gsMemberSachivId.lastName,
            contactNo: uppradhan.gsMemberSachivId.contactNo,
            emailId: uppradhan.gsMemberSachivId.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberSachivId.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Sachiv data fetched successfully!',
    result
  );
});
export const getAllGsUpsachiv = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'upsachiv' }).populate({
    path: 'gsMemberUpsachivId',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Up-Sachiv not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberUpsachivId?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberUpsachivId: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberUpsachivId'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberUpsachivId) {
      gramSamitiMap[gs.gsMemberUpsachivId.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberUpsachivId?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberUpsachivId
        ? {
            _id: uppradhan.gsMemberUpsachivId._id,
            firstName: uppradhan.gsMemberUpsachivId.firstName,
            middleName: uppradhan.gsMemberUpsachivId.middleName,
            lastName: uppradhan.gsMemberUpsachivId.lastName,
            contactNo: uppradhan.gsMemberUpsachivId.contactNo,
            emailId: uppradhan.gsMemberUpsachivId.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberUpsachivId.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Up-Sachiv data fetched successfully!',
    result
  );
});
export const getAllGsSadasya1 = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'sadasya1' }).populate({
    path: 'gsMemberSadasya1Id',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Sadasya1 not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberSadasya1Id?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberSadasya1Id: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberSadasya1Id'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberSadasya1Id) {
      gramSamitiMap[gs.gsMemberSadasya1Id.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberSadasya1Id?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberSadasya1Id
        ? {
            _id: uppradhan.gsMemberSadasya1Id._id,
            firstName: uppradhan.gsMemberSadasya1Id.firstName,
            middleName: uppradhan.gsMemberSadasya1Id.middleName,
            lastName: uppradhan.gsMemberSadasya1Id.lastName,
            contactNo: uppradhan.gsMemberSadasya1Id.contactNo,
            emailId: uppradhan.gsMemberSadasya1Id.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberSadasya1Id.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Sadasya1 data fetched successfully!',
    result
  );
});
export const getAllGsSadasya2 = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'sadasya2' }).populate({
    path: 'gsMemberSadasya2Id',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti Sadasya2 not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberSadasya2Id?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberSadasya2Id: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberSadasya2Id'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberSadasya2Id) {
      gramSamitiMap[gs.gsMemberSadasya2Id.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberSadasya2Id?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberSadasya2Id
        ? {
            _id: uppradhan.gsMemberSadasya2Id._id,
            firstName: uppradhan.gsMemberSadasya2Id.firstName,
            middleName: uppradhan.gsMemberSadasya2Id.middleName,
            lastName: uppradhan.gsMemberSadasya2Id.lastName,
            contactNo: uppradhan.gsMemberSadasya2Id.contactNo,
            emailId: uppradhan.gsMemberSadasya2Id.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberSadasya2Id.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Sadasya2 data fetched successfully!',
    result
  );
});
export const getAllGsSadasya3 = asyncErrorHandler(async (req, res, next) => {
 
  const uppradhans = await User.find({ role: 'sadasya3' }).populate({
    path: 'gsMemberSadasya3Id',
    select:
      'firstName middleName lastName contactNo emailId designationInSvpGramSamii',
  });

  if (!uppradhans.length) {
    return notFoundResponse(res, 'Gram Samiti (Sadasya3) not found!');
  }


  const uppradhanIds = uppradhans
    .map((p) => p.gsMemberSadasya3Id?._id)
    .filter(Boolean);

  
  const gramSamitis = await GramSamiti.find({
    gsMemberSadasya3Id: { $in: uppradhanIds },
  }).select(
    'state district subDistrict village pincode gramPanchayat gsMemberSadasya3Id'
  );


  const gramSamitiMap = {};
  gramSamitis.forEach((gs) => {
    if (gs.gsMemberSadasya3Id) {
      gramSamitiMap[gs.gsMemberSadasya3Id.toString()] = {
        state: gs.state,
        district: gs.district,
        subDistrict: gs.subDistrict,
        village: gs.village,
        pincode: gs.pincode,
        gramPanchayat: gs.gramPanchayat,
      };
    }
  });

  
  const result = uppradhans.map((uppradhan) => {
    const uppradhanId = uppradhan.gsMemberSadasya3Id?._id.toString();
    const gsInfo = uppradhanId ? gramSamitiMap[uppradhanId] : null;

    return {
      _id: uppradhan._id,
      userName: uppradhan.userName,
      svpEmail: uppradhan.svpEmail,
      role: uppradhan.role,
      anchalAreaId: uppradhan.anchalAreaId,
      sankulAreaId: uppradhan.sankulAreaId,
      sanchAreaId: uppradhan.sanchAreaId,
      upSanchAreaId: uppradhan.upSanchAreaId,
      anchalAreaFromUser: uppradhan.anchalAreaFromUser,
      sankulAreaFromUser: uppradhan.sankulAreaFromUser,
      sanchAreaFromUser: uppradhan.sanchAreaFromUser,
      upSanchAreaFromUser: uppradhan.upSanchAreaFromUser,
      isTemporaryRole: uppradhan.isTemporaryRole,
      createdAt: uppradhan.createdAt,
      gramSamitiInfo: gsInfo || {},
      pradhanInfo: uppradhan.gsMemberSadasya3Id
        ? {
            _id: uppradhan.gsMemberSadasya3Id._id,
            firstName: uppradhan.gsMemberSadasya3Id.firstName,
            middleName: uppradhan.gsMemberSadasya3Id.middleName,
            lastName: uppradhan.gsMemberSadasya3Id.lastName,
            contactNo: uppradhan.gsMemberSadasya3Id.contactNo,
            emailId: uppradhan.gsMemberSadasya3Id.emailId,
            designationInSvpGramSamii:
              uppradhan.gsMemberSadasya3Id.designationInSvpGramSamii,
          }
        : {},
    };
  });

  return successResponseWithData(
    res,
    'All Gram Samiti Sadasya3 data fetched successfully!',
    result
  );
});

export const getGsPradhanById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return badRequestResponse(res, 'Pradhan ID is required');
  }

  // Find the pradhan user by ID
  const pradhan = await User.findOne({ 
    _id: id, 
    role: 'pradhan' 
  }).populate({
    path: 'gsMemberPradhanId',
    select: 'firstName middleName lastName contactNo emailId designationInSvpGramSamii'
  });

  if (!pradhan) {
    return notFoundResponse(res, 'Gram Samiti Pradhan not found!');
  }

  // Get associated Gram Samiti information
  const pradhanId = pradhan.gsMemberPradhanId?._id;
  
  if (!pradhanId) {
    return notFoundResponse(res, 'Gram Samiti Pradhan member details not found!');
  }

  const gramSamiti = await GramSamiti.findOne({
    gsMemberPradhanId: pradhanId
  }).select(
    '_id svpName state district subDistrict village pincode gramPanchayat gsMemberPradhanId'
  );

  // Format the result similar to getAllGsPradhan
  const result = {
    _id: pradhan._id,
    userName: pradhan.userName,
    svpEmail: pradhan.svpEmail,
    role: pradhan.role,
    anchalAreaId: pradhan.anchalAreaId,
    sankulAreaId: pradhan.sankulAreaId,
    sanchAreaId: pradhan.sanchAreaId,
    upSanchAreaId: pradhan.upSanchAreaId,
    anchalAreaFromUser: pradhan.anchalAreaFromUser,
    sankulAreaFromUser: pradhan.sankulAreaFromUser,
    sanchAreaFromUser: pradhan.sanchAreaFromUser,
    upSanchAreaFromUser: pradhan.upSanchAreaFromUser,
    isTemporaryRole: pradhan.isTemporaryRole,
    createdAt: pradhan.createdAt,
    gramSamitiInfo: gramSamiti ? {
      _id: gramSamiti._id,
      state: gramSamiti.state,
      district: gramSamiti.district,
      subDistrict: gramSamiti.subDistrict,
      village: gramSamiti.village,
      pincode: gramSamiti.pincode,
      gramPanchayat: gramSamiti.gramPanchayat,
      svpName: gramSamiti.svpName,
    } : {},
    pradhanInfo: pradhan.gsMemberPradhanId ? {
      _id: pradhan.gsMemberPradhanId._id,
      firstName: pradhan.gsMemberPradhanId.firstName,
      middleName: pradhan.gsMemberPradhanId.middleName,
      lastName: pradhan.gsMemberPradhanId.lastName,
      contactNo: pradhan.gsMemberPradhanId.contactNo,
      emailId: pradhan.gsMemberPradhanId.emailId,
      designationInSvpGramSamii: pradhan.gsMemberPradhanId.designationInSvpGramSamii
    } : {}
  };

  return successResponseWithData(
    res,
    'Gram Samiti Pradhan data fetched successfully!',
    result
  );
});