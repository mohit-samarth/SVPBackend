import { Varg } from '../../models/vargsSchedule/vargSchema.js';
import { VargInvitation } from '../../models/vargsSchedule/varginvitationSchema.js';
import { User } from '../../models/userRoles/userSchema.js';
import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import ErrorHandler from '../../middlewares/error.js';
import mongoose from 'mongoose';
import { sendNotification } from '../../utils/notificationService.js';
import { AnchalAreaNew } from '../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';
import { SankulAreaNew } from '../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { UpSanchAreaNew } from '../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { SanchAreaNew } from '../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';



// Helper to check for scheduling conflicts
const checkVargConflicts = async (startDate, endDate, areaIds, excludeVargId = null) => {
  const query = {
    status: 'scheduled',
    $or: [
      // Check if new varg starts during an existing varg
      {
        startDate: { $lte: startDate },
        endDate: { $gte: startDate }
      },
      // Check if new varg ends during an existing varg
      {
        startDate: { $lte: endDate },
        endDate: { $gte: endDate }
      },
      // Check if new varg completely contains an existing varg
      {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }
    ]
  };

  // Add area filters
  if (areaIds.anchalAreaId) {
    query.anchalAreaId = areaIds.anchalAreaId;
  } else if (areaIds.sankulAreaId) {
    query.sankulAreaId = areaIds.sankulAreaId;
  } else if (areaIds.sanchAreaId) {
    query.sanchAreaId = areaIds.sanchAreaId;
  } else if (areaIds.upSanchAreaId) {
    query.upSanchAreaId = areaIds.upSanchAreaId;
  }

  // Exclude the current varg if we're updating
  if (excludeVargId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeVargId) };
  }

  return await Varg.find(query);
};

// Helper to determine area IDs based on user role
const getAreaIdsFromUser = (user) => {
  const areaIds = {};

  if (user.role === 'anchalPramukh' && user.anchalAreaId) {
    areaIds.anchalAreaId = user.anchalAreaId;
  } else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
    areaIds.sankulAreaId = user.sankulAreaId;
  } else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
    areaIds.sanchAreaId = user.sanchAreaId;
  } else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
    areaIds.upSanchAreaId = user.upSanchAreaId;
  }

  return areaIds;
};

// Helper to check if a higher level varg is already scheduled
const checkHigherLevelConflicts = async (startDate, endDate, user) => {
  const query = {
    status: 'scheduled',
    $or: [
      // Check date conflicts as in checkVargConflicts
      {
        startDate: { $lte: startDate },
        endDate: { $gte: startDate }
      },
      {
        startDate: { $lte: endDate },
        endDate: { $gte: endDate }
      },
      {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }
    ]
  };

  // Check for higher level conflicts based on user role
  if (user.role === 'upSanchPramukh' && user.sanchAreaId) {
    // Check for Sanch, Sankul, or Anchal level vargs
    query.$or = [
      { sanchAreaId: user.sanchAreaId },
      { sankulAreaId: user.sankulAreaId },
      { anchalAreaId: user.anchalAreaId }
    ];
  } else if (user.role === 'sanchPramukh' && user.sankulAreaId) {
    // Check for Sankul or Anchal level vargs
    query.$or = [
      { sankulAreaId: user.sankulAreaId },
      { anchalAreaId: user.anchalAreaId }
    ];
  } else if (user.role === 'sankulPramukh' && user.anchalAreaId) {
    // Check for Anchal level vargs
    query.anchalAreaId = user.anchalAreaId;
  }

  return await Varg.find(query);
};

// Define allowed varg types for each role
const allowedVargTypes = {
  anchalPramukh: [
    'Sanghatan Prathmik Abhyaas Varg (SPAV)',
    'Acharya Prathmik Abhyaas Varg (APAV)',
    'Prashikshak Prashikshan Varg (PPV)',
    'Masik Abhyaas Varg (MAV)',
    'Naipunya Varg (NV)',
    'Dakshta Varg (DV)',
    'Sanghatan Dakshata Varg (SDV)',
    'Maasik Mulyankan and Samanvay Baithak (MMSB)',
    'Vistarya Karya Varg (VKV)',
  ],
  sankulPramukh: [
    'Sanghatan Prathmik Abhyaas Varg (SPAV)',
    'Acharya Prathmik Abhyaas Varg (APAV)',
    'Prashikshak Prashikshan Varg (PPV)',
    'Masik Abhyaas Varg (MAV)',
    'Sanghatan Dakshata Varg (SDV)',
    'Vistarya Karya Varg (VKV)',
  ],
  // Define for other roles as needed
  superAdmin: ['Sanghatan Prathmik Abhyaas Varg (SPAV)',
      'Acharya Prathmik Abhyaas Varg (APAV)',
      'Prashikshak Prashikshan Varg (PPV)',
      'Masik Abhyaas Varg (MAV)',
      'Naipunya Varg (NV)',
      'Dakshta Varg (DV)',
      'Sanghatan Dakshata Varg (SDV)',
      'Maasik Mulyankan and Samanvay Baithak (MMSB)',
      'Karyakarta Mulyankan Baithak(KMB)',
      'Vistarya Karya Varg (VKV)',
      'Kendriy Samnavay Varg (KSV)'
    ],
  systemAdmin: ['Sanghatan Prathmik Abhyaas Varg (SPAV)',
      'Acharya Prathmik Abhyaas Varg (APAV)',
      'Prashikshak Prashikshan Varg (PPV)',
      'Masik Abhyaas Varg (MAV)',
      'Naipunya Varg (NV)',
      'Dakshta Varg (DV)',
      'Sanghatan Dakshata Varg (SDV)',
      'Maasik Mulyankan and Samanvay Baithak (MMSB)',
      'Karyakarta Mulyankan Baithak(KMB)',
      'Vistarya Karya Varg (VKV)',
      'Kendriy Samnavay Varg (KSV)', 
    ]
};

// Create a new varg
export const createVarg = asyncErrorHandler(async (req, res, next) => {
  const {
    name,
    startDate,
    endDate,
    vargType,
    location,
    platform,
    meetingUrl,
    description,
    invitedUsers,
    isUrgent,
    urgencyReason,
    overridePermissionFrom
  } = req.body;
  const user = req.user;

  // Validate vargType is allowed for this role
  const userRole = user.role;
  const allowedTypes = allowedVargTypes[userRole] || [];
  
  if (!allowedTypes.includes(name)) {
    return next(new ErrorHandler(`You are not authorized to create a varg of type "${name}"`, 403));
  }

  // Validate dates
  const vargStartDate = new Date(startDate);
  const vargEndDate = new Date(endDate);

  if (vargEndDate <= vargStartDate) {
    return next(new ErrorHandler('End date must be after start date', 400));
  }

  // Validate varg type specific fields
  if (vargType === 'Online') {
    if (!platform) {
      return next(new ErrorHandler('Platform is required for online vargs', 400));
    }
    if (!meetingUrl) {
      return next(new ErrorHandler('Meeting URL is required for online vargs', 400));
    }
    // Optional validation for meeting URL format
    if (!meetingUrl.startsWith('http')) {
      return next(new ErrorHandler('Please provide a valid meeting URL', 400));
    }
  } else if (vargType === 'Offline') {
    if (!location) {
      return next(new ErrorHandler('Location is required for offline vargs', 400));
    }
  }

  // Get area IDs based on user role
  const areaIds = getAreaIdsFromUser(user);

  // First check for any scheduling conflicts (same level)
  const conflictingVargs = await checkVargConflicts(vargStartDate, vargEndDate, areaIds);
  
  // Then check for higher level conflicts if applicable
  let higherLevelConflicts = [];
  if (user.role !== 'anchalPramukh' && user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    higherLevelConflicts = await checkHigherLevelConflicts(vargStartDate, vargEndDate, user);
  }
  
  // Combine all conflicts
  const allConflicts = [...conflictingVargs, ...higherLevelConflicts];
  
  // If there are conflicts and this is not marked as urgent, return error with conflict details
  if (allConflicts.length > 0 && !isUrgent) {
    // Format conflict information for response
    const conflictDetails = allConflicts.map(conflict => ({
      name: conflict.name,
      startDate: conflict.startDate.toLocaleDateString(),
      endDate: conflict.endDate.toLocaleDateString(),
      level: conflict.anchalAreaId ? 'Anchal' : 
             conflict.sankulAreaId ? 'Sankul' : 
             conflict.sanchAreaId ? 'Sanch' : 'UpSanch'
    }));
    
    return res.status(409).json({
      success: false,
      message: 'There are scheduling conflicts with existing vargs',
      conflicts: conflictDetails,
      requiresUrgent: true
    });
  }

  // If urgent and there are conflicts, ensure proper validation
  if (isUrgent && allConflicts.length > 0) {
    // Check if urgency reason is provided
    if (!urgencyReason) {
      return next(new ErrorHandler('Urgency reason is required for urgent vargs with schedule conflicts', 400));
    }
    
    // For higher level conflicts, require override permission
    if (higherLevelConflicts.length > 0) {
      // Validate that the permission is from a valid higher authority
      if (!overridePermissionFrom) {
        return next(new ErrorHandler('Override permission is required for conflicts with higher level vargs', 400));
      }
      
      const permissionGranter = await User.findById(overridePermissionFrom);
      if (!permissionGranter) {
        return next(new ErrorHandler('Invalid permission granter specified', 400));
      }

      // Check if permission granter has appropriate authority
      let validOverride = false;
      if (permissionGranter.role === 'superAdmin' || permissionGranter.role === 'systemAdmin') {
        validOverride = true;
      }
      
      if (!validOverride) {
        return next(new ErrorHandler('The permission granter does not have the authority to override this conflict', 403));
      }
    }
  }

  // Determine if Super Admin approval is needed:
  // 1. All urgent vargs need approval
  const requiresSuperAdminApproval = 
    isUrgent || 
    (user.role !== 'superAdmin' && user.role !== 'systemAdmin');

  // Create the varg with pending status if approval is needed
  const vargData = {
    name,
    startDate: vargStartDate,
    endDate: vargEndDate,
    vargType,
    description,
    createdBy: user._id,
    creatorRole: user.role,
    superAdminApproved: !requiresSuperAdminApproval,
    isUrgent: !!isUrgent,
    urgencyReason: urgencyReason || null,
    overridePermissionFrom: higherLevelConflicts.length > 0 ? overridePermissionFrom : null,
    ...areaIds
  };

  // Add type-specific fields
  if (vargType === 'Online') {
    vargData.platform = platform;
    vargData.meetingUrl = meetingUrl;
  } else {
    vargData.location = location;
  }

  const varg = await Varg.create(vargData);

  // Create invitations for selected users
  if (invitedUsers && invitedUsers.length > 0) {
    const invitations = invitedUsers.map(userId => ({
      vargId: varg._id,
      invitedUser: userId,
      status: 'pending',
      notificationSent: false // Don't send notifications until approved
    }));

    await VargInvitation.insertMany(invitations);

    // Update varg with total invited count
    varg.totalInvited = invitedUsers.length;
    await varg.save();
  }

  // Add notification to Super Admins if approval is needed
  if (requiresSuperAdminApproval) {
    // Get all superAdmin and systemAdmin users
    const adminUsers = await User.find({
      role: { $in: ['superAdmin', 'systemAdmin'] },
      isDeleted: false
    });

    // Prepare notification message with conflict details if urgent
    let notificationMessage = `A new varg "${name}" created by ${user.userName} requires your approval.`;
    if (isUrgent && allConflicts.length > 0) {
      notificationMessage += ` This is an URGENT varg with ${allConflicts.length} scheduling conflicts. Reason: ${urgencyReason}`;
    }

    // Send notification to each admin
    for (const admin of adminUsers) {
      await sendNotification(
        admin._id.toString(),
        isUrgent ? 'URGENT Varg Approval Needed' : 'Varg Approval Needed',
        notificationMessage,
        {
          type: 'VARG_APPROVAL_NEEDED',
          vargId: varg._id.toString(),
          isUrgent: !!isUrgent,
          hasConflicts: allConflicts.length > 0
        }
      );
    }
  }

  res.status(201).json({
    success: true,
    message: isUrgent
      ? 'Urgent varg created and awaiting Super Admin approval'
      : (requiresSuperAdminApproval
        ? 'Varg created and awaiting Super Admin approval'
        : 'Varg created successfully'),
    varg
  });
});

// Super Admin approval
export const approveVarg = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Ensure only Super Admins can approve
  if (user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('Only Super Admins can approve vargs', 403));
  }

  // Find the varg
  const varg = await Varg.findById(id);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Check if already approved
  if (varg.superAdminApproved) {
    return next(new ErrorHandler('Varg has already been approved', 400));
  }

  // Update varg with approval details
  varg.superAdminApproved = true;
  varg.superAdminApprovedBy = user._id;
  varg.superAdminApprovedAt = new Date();
  varg.status = 'scheduled';  // Change status to scheduled upon approval
  await varg.save();

  // Find all pending invitations where notifications haven't been sent yet
  const invitations = await VargInvitation.find({
    vargId: varg._id,
    status: 'pending',
    notificationSent: false
  });

  // Get the creator of the varg to include in notification
  const vargCreator = await User.findById(varg.createdBy);
  const creatorName = vargCreator ? vargCreator.userName : "An administrator";

  // Prepare location/platform details based on varg type
  let locationDetails = '';
  if (varg.vargType === 'Online') {
    locationDetails = `Platform: ${varg.platform}, Meeting URL: ${varg.meetingUrl}`;
  } else {
    locationDetails = `Location: ${varg.location}`;
  }

  // Send notifications to all invited users
  for (const invitation of invitations) {
    const invitedUser = await User.findById(invitation.invitedUser);

    if (invitedUser) {
      const notificationMessage = varg.isUrgent ?
        `URGENT: You have been invited by ${creatorName} to attend ${varg.name} (${varg.vargType}) from ${new Date(varg.startDate).toLocaleDateString()} to ${new Date(varg.endDate).toLocaleDateString()}. ${locationDetails}` :
        `You have been invited by ${creatorName} to attend ${varg.name} (${varg.vargType}) from ${new Date(varg.startDate).toLocaleDateString()} to ${new Date(varg.endDate).toLocaleDateString()}. ${locationDetails}`;

      // Create notification in the database for the invited user
      await sendNotification(
        invitedUser._id.toString(),
        varg.isUrgent ? 'Urgent Varg Invitation' : 'New Varg Invitation',
        notificationMessage,
        {
          type: 'VARG_INVITATION',
          vargId: varg._id.toString(),
          invitationId: invitation._id.toString(), // Include the invitation ID for response tracking
          isUrgent: !!varg.isUrgent,
          vargType: varg.vargType,
          // Include location details based on varg type
          ...(varg.vargType === 'Online' ? {
            platform: varg.platform,
            meetingUrl: varg.meetingUrl
          } : {
            location: varg.location
          }),
          responseOptions: [
            { value: 'accepted', label: 'Accept' },
            { value: 'rejected', label: 'Reject', requiresReason: true },
            { value: 'maybe', label: 'Maybe' }
          ],
          rejectionReasons: [
            { value: 'Death', label: 'Death' },
            { value: 'Casualty', label: 'Casualty' },
            { value: 'Accident', label: 'Accident' },
            { value: 'Illness', label: 'Illness' },
            { value: 'Function', label: 'Function' },
            { value: 'Marriage', label: 'Marriage' },
            { value: 'Other', label: 'Other', allowCustom: true }
          ]
        }
      );

      // Mark notification as sent
      invitation.notificationSent = true;
      await invitation.save();
    }
  }

  // If this is an urgent varg that overrides other vargs, notify affected varg creators
  if (varg.isUrgent) {
    // Check for conflicts again to notify all affected parties
    const areaIds = {};
    if (varg.anchalAreaId) areaIds.anchalAreaId = varg.anchalAreaId;
    else if (varg.sankulAreaId) areaIds.sankulAreaId = varg.sankulAreaId;
    else if (varg.sanchAreaId) areaIds.sanchAreaId = varg.sanchAreaId;
    else if (varg.upSanchAreaId) areaIds.upSanchAreaId = varg.upSanchAreaId;
    
    const conflictingVargs = await checkVargConflicts(varg.startDate, varg.endDate, areaIds, varg._id);
    
    // Notify creators of conflicting vargs
    for (const conflictingVarg of conflictingVargs) {
      const conflictCreator = await User.findById(conflictingVarg.createdBy);
      if (conflictCreator) {
        await sendNotification(
          conflictCreator._id.toString(),
          'Urgent Varg Scheduled During Your Varg',
          `An urgent varg "${varg.name}" has been approved and scheduled during your varg "${conflictingVarg.name}" (${new Date(conflictingVarg.startDate).toLocaleDateString()} to ${new Date(conflictingVarg.endDate).toLocaleDateString()}).`,
          {
            type: 'URGENT_VARG_OVERLAP',
            vargId: varg._id.toString(),
            conflictingVargId: conflictingVarg._id.toString()
          }
        );
      }
    }
  }

  // Notify varg creator that their varg has been approved
  if (vargCreator) {
    await sendNotification(
      vargCreator._id.toString(),
      'Varg Approved',
      `Your ${varg.isUrgent ? 'urgent ' : ''}varg "${varg.name}" has been approved by a Super Admin and is now scheduled.`,
      {
        type: 'VARG_CREATOR_APPROVED',
        vargId: varg._id.toString()
      }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Varg approved successfully and notifications sent',
    varg
  });
});

// Respond to a varg invitation
export const respondToVargInvitation = asyncErrorHandler(async (req, res, next) => {
  const { invitationId } = req.params;
  const { response, rejectionReason, customRejectionReason } = req.body;
  const user = req.user;

  // Validate response
  if (!['accepted', 'rejected', 'maybe'].includes(response)) {
    return next(new ErrorHandler('Invalid response type', 400));
  }

  // Find the invitation
  const invitation = await VargInvitation.findById(invitationId);

  if (!invitation) {
    return next(new ErrorHandler('Invitation not found', 404));
  }

  // Ensure the invitation belongs to the current user
  if (invitation.invitedUser.toString() !== user._id.toString()) {
    return next(new ErrorHandler('You are not authorized to respond to this invitation', 403));
  }

  // Check if the user has already responded (status is not 'pending')
  if (invitation.status !== 'pending') {
    return next(new ErrorHandler('You have already responded to this invitation', 400));
  }

  // If rejected, ensure rejection reason is provided
  if (response === 'rejected') {
    if (!rejectionReason) {
      return next(new ErrorHandler('Rejection reason is required', 400));
    }

    // Validate rejection reason
    const validReasons = ['Death', 'Casualty', 'Accident', 'Illness', 'Function', 'Marriage', 'Other'];
    if (!validReasons.includes(rejectionReason)) {
      return next(new ErrorHandler('Invalid rejection reason', 400));
    }

    // If "Other" is selected, ensure custom reason is provided
    if (rejectionReason === 'Other' && !customRejectionReason) {
      return next(new ErrorHandler('Custom rejection reason is required when selecting "Other"', 400));
    }

    // Update invitation with rejection details
    invitation.rejectionReason = rejectionReason;
    invitation.customRejectionReason = rejectionReason === 'Other' ? customRejectionReason : null;
  } else {
    // Clear rejection reason if not rejected
    invitation.rejectionReason = null;
    invitation.customRejectionReason = null;
  }

  // Update invitation status and response date
  invitation.status = response;
  invitation.responseDate = new Date();
  await invitation.save();

  // Find the varg to include in notification
  const varg = await Varg.findById(invitation.vargId);
  const vargCreator = varg ? await User.findById(varg.createdBy) : null;

  // Send notification to varg creator about the response
  if (vargCreator && varg) {
    let responseMessage;
    if (response === 'accepted') {
      responseMessage = `${user.userName} has accepted your invitation to attend "${varg.name}"`;
    } else if (response === 'rejected') {
      responseMessage = `${user.userName} has declined your invitation to attend "${varg.name}"`;
      if (rejectionReason) {
        responseMessage += ` (Reason: ${rejectionReason}${rejectionReason === 'Other' ? ` - ${customRejectionReason}` : ''})`;
      }
    } else { // maybe
      responseMessage = `${user.userName} has tentatively responded to your invitation to attend "${varg.name}"`;
    }

    await sendNotification(
      vargCreator._id.toString(),
      'Varg Invitation Response',
      responseMessage,
      {
        type: 'VARG_INVITATION_RESPONSE',
        vargId: varg._id.toString(),
        invitationId: invitation._id.toString(),
        response: response
      }
    );
  }

  // Update varg attendance metrics
  if (varg) {
    // Get counts for each response type
    const responseStats = await VargInvitation.aggregate([
      { $match: { vargId: new mongoose.Types.ObjectId(varg._id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Update varg with response stats
    const statsObj = {};
    responseStats.forEach(stat => {
      statsObj[`${stat._id}Count`] = stat.count;
    });

    await Varg.findByIdAndUpdate(varg._id, {
      totalAccepted: statsObj.acceptedCount || 0,
      totalRejected: statsObj.rejectedCount || 0,
      totalMaybe: statsObj.maybeCount || 0,
      pendingCount: statsObj.pendingCount || 0
    });
  }

  res.status(200).json({
    success: true,
    message: `Successfully ${response === 'accepted' ? 'accepted' : response === 'rejected' ? 'declined' : 'tentatively responded to'} the invitation`,
    invitation
  });
});

// Get higher authorities based on user role
export const getHigherAuthorities = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;

  const query = { isDeleted: false };

  // Determine which higher authorities to fetch based on user role
  if (user.role === 'upSanchPramukh') {
    // UpSanch can get Sanch, Sankul, Anchal, and Super Admins
    query.role = { $in: ['sanchPramukh', 'sankulPramukh', 'anchalPramukh', 'superAdmin', 'systemAdmin'] };

    // Filter by the same hierarchical areas
    if (user.sanchAreaId) query.sanchAreaId = user.sanchAreaId;
    if (user.sankulAreaId) query.sankulAreaId = user.sankulAreaId;
    if (user.anchalAreaId) query.anchalAreaId = user.anchalAreaId;

  } else if (user.role === 'sanchPramukh') {
    // Sanch can get Sankul, Anchal, and Super Admins
    query.role = { $in: ['sankulPramukh', 'anchalPramukh', 'superAdmin', 'systemAdmin'] };

    // Filter by the same hierarchical areas
    if (user.sankulAreaId) query.sankulAreaId = user.sankulAreaId;
    if (user.anchalAreaId) query.anchalAreaId = user.anchalAreaId;

  } else if (user.role === 'sankulPramukh') {
    // Sankul can get Anchal and Super Admins
    query.role = { $in: ['anchalPramukh', 'superAdmin', 'systemAdmin'] };

    // Filter by the same anchal area
    if (user.anchalAreaId) query.anchalAreaId = user.anchalAreaId;

  } else if (user.role === 'anchalPramukh') {
    // Anchal can only get Super Admins
    query.role = { $in: ['superAdmin', 'systemAdmin'] };
  } else {
    // For other roles (including superAdmin), return empty list
    // as they don't need override permissions
    return res.status(200).json({
      success: true,
      count: 0,
      users: []
    });
  }

  const users = await User.find(query)
    .select('_id userName svpEmail role');

  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
});

// Get all vargs (with filtering options)
export const getAllVargs = asyncErrorHandler(async (req, res, next) => {
  const { startDate, endDate, status, role } = req.query;
  const user = req.user;

  const query = {};

  // Apply date filters if provided
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }

  // Apply status filter if provided
  if (status) {
    query.status = status;
  }

  // Apply area filters based on user role
  if (user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    if (user.role === 'anchalPramukh' && user.anchalAreaId) {
      query.anchalAreaId = user.anchalAreaId;
    } else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
      query.sankulAreaId = user.sankulAreaId;
    } else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
      query.sanchAreaId = user.sanchAreaId;
    } else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
      query.upSanchAreaId = user.upSanchAreaId;
    }
  }

  // Apply creator role filter if provided
  if (role) {
    query.creatorRole = role;
  }

  const vargs = await Varg.find(query)
    .sort({ startDate: -1 })
    .populate('createdBy', 'userName svpEmail role')
    .populate('cancelledBy', 'userName svpEmail role');

  res.status(200).json({
    success: true,
    count: vargs.length,
    vargs
  });
});

// Get single varg details with participants
export const getVargDetails = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const varg = await Varg.findById(id)
    .populate('createdBy', 'userName svpEmail role')
    .populate('cancelledBy', 'userName svpEmail role');

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Get all invitations for this varg
  const invitations = await VargInvitation.find({ vargId: id })
    .populate('invitedUser', 'userName svpEmail role');

  const participants = {
    accepted: invitations.filter(inv => inv.status === 'accepted').map(inv => inv.invitedUser),
    rejected: invitations.filter(inv => inv.status === 'rejected').map(inv => ({
      user: inv.invitedUser,
      reason: inv.rejectionReason
    })),
    maybe: invitations.filter(inv => inv.status === 'maybe').map(inv => inv.invitedUser),
    pending: invitations.filter(inv => inv.status === 'pending').map(inv => inv.invitedUser)
  };

  res.status(200).json({
    success: true,
    varg,
    participants
  });
});

// Get approved vargs a user has been invited to (for dashboard)
export const getUserInvitedVargs = asyncErrorHandler(async (req, res, next) => {
  const user = req.user;
  
  // Find all invitations for this user
  const invitations = await VargInvitation.find({ 
    invitedUser: user._id 
  }).sort({ responseDate: -1 });
  
  // Extract all varg IDs from invitations
  const vargIds = invitations.map(invitation => invitation.vargId);
  
  // Fetch only approved vargs with these IDs
  const vargs = await Varg.find({ 
    _id: { $in: vargIds },
    superAdminApproved: true,  // Only get approved vargs
    status: { $ne: 'cancelled' }  // Exclude cancelled vargs
  })
  .populate('createdBy', 'userName svpEmail role')
  .sort({ startDate: 1 }); // Sort by upcoming vargs first
  
  // Combine varg details with invitation status
  const invitedVargs = vargs.map(varg => {
    // Find the relevant invitation for this varg
    const invitation = invitations.find(
      inv => inv.vargId.toString() === varg._id.toString()
    );
    
    return {
      varg: varg,
      invitation: {
        _id: invitation._id,
        status: invitation.status,
        responseDate: invitation.responseDate,
        rejectionReason: invitation.rejectionReason,
        customRejectionReason: invitation.customRejectionReason
      },
      // Include time details for easy front-end display
      timingDetails: {
        isPast: new Date(varg.endDate) < new Date(),
        isOngoing: new Date() >= new Date(varg.startDate) && new Date() <= new Date(varg.endDate),
        isUpcoming: new Date() < new Date(varg.startDate),
        daysUntil: Math.ceil((new Date(varg.startDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };
  });
  
  // Group the vargs by their timing and user response status
  const groupedVargs = {
    upcoming: invitedVargs.filter(v => v.timingDetails.isUpcoming),
    ongoing: invitedVargs.filter(v => v.timingDetails.isOngoing),
    past: invitedVargs.filter(v => v.timingDetails.isPast),
    // Further categorize by user response
    myResponses: {
      accepted: invitedVargs.filter(v => v.invitation.status === 'accepted'),
      rejected: invitedVargs.filter(v => v.invitation.status === 'rejected'),
      maybe: invitedVargs.filter(v => v.invitation.status === 'maybe'),
      pending: invitedVargs.filter(v => v.invitation.status === 'pending')
    }
  };
  
  // Count urgent vargs that need attention
  const urgentCount = invitedVargs.filter(v => 
    v.varg.isUrgent && 
    v.invitation.status === 'pending'
  ).length;
  
  res.status(200).json({
    success: true,
    count: invitedVargs.length,
    urgentCount,
    invitedVargs: groupedVargs
  });
});

// Update varg details
export const updateVarg = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, startDate, endDate, location, description } = req.body;
  const user = req.user;

  // Find the varg
  const varg = await Varg.findById(id);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Check if user has permission to update
  if (varg.createdBy.toString() !== user._id.toString() &&
    user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('You do not have permission to update this varg', 403));
  }

  // Check if varg is already cancelled
  if (varg.status === 'cancelled') {
    return next(new ErrorHandler('Cannot update a cancelled varg', 400));
  }

  // Check if varg is already completed
  if (varg.status === 'completed') {
    return next(new ErrorHandler('Cannot update a completed varg', 400));
  }

  // Validate dates if being updated
  let vargStartDate = varg.startDate;
  let vargEndDate = varg.endDate;

  if (startDate) vargStartDate = new Date(startDate);
  if (endDate) vargEndDate = new Date(endDate);

  if (vargEndDate <= vargStartDate) {
    return next(new ErrorHandler('End date must be after start date', 400));
  }

  // Get area IDs
  const areaIds = {
    anchalAreaId: varg.anchalAreaId,
    sankulAreaId: varg.sankulAreaId,
    sanchAreaId: varg.sanchAreaId,
    upSanchAreaId: varg.upSanchAreaId
  };

  // Check for conflicting vargs if dates are being changed
  if (startDate || endDate) {
    const conflictingVargs = await checkVargConflicts(vargStartDate, vargEndDate, areaIds, id);

    if (conflictingVargs.length > 0) {
      return next(new ErrorHandler('There is already a varg scheduled during this period in your area', 409));
    }

    // Check for higher level conflicts (if applicable)
    if (varg.creatorRole !== 'anchalPramukh' &&
      varg.creatorRole !== 'superAdmin' &&
      varg.creatorRole !== 'systemAdmin') {
      const higherLevelConflicts = await checkHigherLevelConflicts(vargStartDate, vargEndDate, user);

      if (higherLevelConflicts.length > 0) {
        return next(new ErrorHandler('There is already a varg scheduled by a higher level administrator during this period', 409));
      }
    }
  }

  // Update varg
  const updatedVarg = await Varg.findByIdAndUpdate(
    id,
    {
      name: name || varg.name,
      startDate: vargStartDate,
      endDate: vargEndDate,
      location: location || varg.location,
      description: description !== undefined ? description : varg.description
    },
    { new: true, runValidators: true }
  );

  // Notify all invited users about the update
  const invitations = await VargInvitation.find({ vargId: id });

  for (const invitation of invitations) {
    const invitedUser = await User.findById(invitation.invitedUser);

    if (invitedUser && invitedUser.fcmToken) {
      await sendNotification(
        invitedUser.fcmToken,
        'Varg Update',
        `The details of ${updatedVarg.name} have been updated. Please check the new schedule.`,
        {
          type: 'VARG_UPDATE',
          vargId: id
        }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Varg updated successfully',
    varg: updatedVarg
  });
});

// Cancel a varg
export const cancelVarg = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { cancelReason } = req.body;
  const user = req.user;

  // Find the varg
  const varg = await Varg.findById(id);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Check if user has permission to cancel
  if (varg.createdBy.toString() !== user._id.toString() &&
    user.role !== 'superAdmin' && user.role !== 'systemAdmin') {

    // Check if higher authority can cancel lower authority's vargs
    let canCancel = false;

    if (user.role === 'anchalPramukh' &&
      (varg.creatorRole === 'sankulPramukh' ||
        varg.creatorRole === 'sanchPramukh' ||
        varg.creatorRole === 'upSanchPramukh')) {
      canCancel = true;
    } else if (user.role === 'sankulPramukh' &&
      (varg.creatorRole === 'sanchPramukh' ||
        varg.creatorRole === 'upSanchPramukh')) {
      canCancel = true;
    } else if (user.role === 'sanchPramukh' &&
      varg.creatorRole === 'upSanchPramukh') {
      canCancel = true;
    }

    if (!canCancel) {
      return next(new ErrorHandler('You do not have permission to cancel this varg', 403));
    }
  }

  // Check if varg is already cancelled
  if (varg.status === 'cancelled') {
    return next(new ErrorHandler('Varg is already cancelled', 400));
  }

  // Check if varg is already completed
  if (varg.status === 'completed') {
    return next(new ErrorHandler('Cannot cancel a completed varg', 400));
  }

  // Require a reason for cancellation
  if (!cancelReason) {
    return next(new ErrorHandler('Please provide a reason for cancellation', 400));
  }

  // Update varg status to cancelled
  const cancelledVarg = await Varg.findByIdAndUpdate(
    id,
    {
      status: 'cancelled',
      cancelReason,
      cancelledBy: user._id,
      cancelledAt: new Date()
    },
    { new: true, runValidators: true }
  );

  // Notify all invited users about cancellation
  const invitations = await VargInvitation.find({ vargId: id });

  for (const invitation of invitations) {
    const invitedUser = await User.findById(invitation.invitedUser);

    if (invitedUser) {
      await sendNotification(
        invitedUser._id,
        'Varg Cancelled',
        `${cancelledVarg.name} has been cancelled. Reason: ${cancelReason}`,
        {
          type: 'VARG_CANCELLED',
          vargId: id
        }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Varg cancelled successfully',
    varg: cancelledVarg
  });
});

// Mark a varg as completed
export const completeVarg = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Find the varg
  const varg = await Varg.findById(id);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Check if user has permission to mark as completed
  if (varg.createdBy.toString() !== user._id.toString() &&
    user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('You do not have permission to update this varg', 403));
  }

  // Check if varg is already cancelled
  if (varg.status === 'cancelled') {
    return next(new ErrorHandler('Cannot complete a cancelled varg', 400));
  }

  // Check if varg is already completed
  if (varg.status === 'completed') {
    return next(new ErrorHandler('Varg is already marked as completed', 400));
  }

  // Check if end date has passed
  const currentDate = new Date();
  if (currentDate < varg.endDate) {
    return next(new ErrorHandler('Cannot mark varg as completed before its end date', 400));
  }

  // Update varg status to completed
  const completedVarg = await Varg.findByIdAndUpdate(
    id,
    { status: 'completed' },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Varg marked as completed',
    varg: completedVarg
  });
});

// Get available users for invitation
export const getAvailableUsers = asyncErrorHandler(async (req, res, next) => {
  const { role } = req.query;
  const user = req.user;

  // Base query to exclude deleted users
  let query = { isDeleted: false };
  
  // Apply role filter if provided
  if (role && role !== 'all') {
    query.role = role;
  }

  let availableUsers = [];

  // Handle Anchal Pramukh - can see all users under their Anchal hierarchy
  if (user.role === 'anchalPramukh' && user.anchalAreaId) {
    // Find the anchal area
    const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId);
    if (!anchalArea) {
      return next(new ErrorHandler("Anchal area not found", 404));
    }

    // Get all sankul areas under this anchal
    const sankulAreas = await SankulAreaNew.find({
      anchalName: user.anchalAreaId
    });

    // Get all sanch areas
    const sanchAreas = await SanchAreaNew.find({
      sankulName: { $in: sankulAreas.map(sankul => sankul._id) }
    });

    // Get all up-sanch areas
    const upSanchAreas = await UpSanchAreaNew.find({
      sanchName: { $in: sanchAreas.map(sanch => sanch._id) }
    });

    // Build filter for users under this hierarchy
    const hierarchyFilter = {
      $or: [
        { anchalAreaId: user.anchalAreaId },
        { sankulAreaId: { $in: sankulAreas.map(area => area._id) } },
        { sanchAreaId: { $in: sanchAreas.map(area => area._id) } },
        { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
      ],
      ...query
    };

    availableUsers = await User.find(hierarchyFilter)
      .select('_id userName svpEmail role anchalAreaFromUser sankulAreaFromUser sanchAreaFromUser upSanchAreaFromUser');
  }
  // Handle Sankul Pramukh - can see all users under their Sankul hierarchy
  else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
    // Find the sankul area
    const sankulArea = await SankulAreaNew.findById(user.sankulAreaId);
    if (!sankulArea) {
      return next(new ErrorHandler("Sankul area not found", 404));
    }

    // Get all sanch areas under this sankul
    const sanchAreas = await SanchAreaNew.find({
      sankulName: user.sankulAreaId
    });

    // Get all up-sanch areas
    const upSanchAreas = await UpSanchAreaNew.find({
      sanchName: { $in: sanchAreas.map(sanch => sanch._id) }
    });

    // Build filter for users under this hierarchy
    const hierarchyFilter = {
      $or: [
        { sankulAreaId: user.sankulAreaId },
        { sanchAreaId: { $in: sanchAreas.map(area => area._id) } },
        { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
      ],
      ...query
    };

    availableUsers = await User.find(hierarchyFilter)
      .select('_id userName svpEmail role anchalAreaFromUser sankulAreaFromUser sanchAreaFromUser upSanchAreaFromUser');
  }
  // Handle Sanch Pramukh - can see all users under their Sanch hierarchy
  else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
    // Find the sanch area
    const sanchArea = await SanchAreaNew.findById(user.sanchAreaId);
    if (!sanchArea) {
      return next(new ErrorHandler("Sanch area not found", 404));
    }

    // Get all up-sanch areas under this sanch
    const upSanchAreas = await UpSanchAreaNew.find({
      sanchName: user.sanchAreaId
    });

    // Build filter for users under this hierarchy
    const hierarchyFilter = {
      $or: [
        { sanchAreaId: user.sanchAreaId },
        { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
      ],
      ...query
    };

    availableUsers = await User.find(hierarchyFilter)
      .select('_id userName svpEmail role anchalAreaFromUser sankulAreaFromUser sanchAreaFromUser upSanchAreaFromUser');
  }
  // Handle UpSanch Pramukh - can only see users in their upSanch area
  else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
    const upSanchFilter = {
      upSanchAreaId: user.upSanchAreaId,
      ...query
    };

    availableUsers = await User.find(upSanchFilter)
      .select('_id userName svpEmail role anchalAreaFromUser sankulAreaFromUser sanchAreaFromUser upSanchAreaFromUser');
  }
  // Handle superAdmin or systemAdmin - can see all users or filter by specific area
  else if (user.role === 'superAdmin' || user.role === 'systemAdmin') {
    const { area } = req.query;
    
    if (area && area.type && area.id) {
      if (area.type === 'anchal') {
        query.anchalAreaId = area.id;
      } else if (area.type === 'sankul') {
        query.sankulAreaId = area.id;
      } else if (area.type === 'sanch') {
        query.sanchAreaId = area.id;
      } else if (area.type === 'upsanch') {
        query.upSanchAreaId = area.id;
      }
    }

    availableUsers = await User.find(query)
      .select('_id userName svpEmail role anchalAreaFromUser sankulAreaFromUser sanchAreaFromUser upSanchAreaFromUser');
  } else {
    return next(new ErrorHandler("Access restricted based on user role", 403));
  }

  res.status(200).json({
    success: true,
    count: availableUsers.length,
    users: availableUsers
  });
});

// Get calendar view data for vargs
export const getCalendarData = asyncErrorHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const user = req.user;

  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide start and end dates for calendar view', 400));
  }

  const query = {
    startDate: { $gte: new Date(startDate) },
    endDate: { $lte: new Date(endDate) }
  };

  // Filter by area based on user's role
  if (user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    if (user.role === 'anchalPramukh' && user.anchalAreaId) {
      query.anchalAreaId = user.anchalAreaId;
    } else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
      query.sankulAreaId = user.sankulAreaId;
    } else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
      query.sanchAreaId = user.sanchAreaId;
    } else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
      query.upSanchAreaId = user.upSanchAreaId;
    }
  }

  // Get all relevant vargs with more detailed creator information
  const vargs = await Varg.find(query)
    .populate({
      path: 'createdBy',
      select: 'userName role email' // Added more fields for better display
    });

  // Format for calendar view with enhanced creator info
  const calendarEvents = vargs.map(varg => ({
    id: varg._id,
    title: varg.name,
    start: varg.startDate,
    end: varg.endDate,
    location: varg.location,
    status: varg.status,
    // Separating creator info for more flexibility in frontend display
    creator: {
      id: varg.createdBy?._id,
      name: varg.createdBy?.userName || 'Unknown',
      role: varg.createdBy?.role || 'Unknown',
      email: varg.createdBy?.email,
    },
    participants: varg.totalAccepted,
    color: varg.status === 'scheduled' ? '#4CAF50' :
           varg.status === 'cancelled' ? '#F44336' : 
           varg.status === 'completed' ? '#FF9800' : '#2196F3'
  }));

  res.status(200).json({
    success: true,
    count: calendarEvents.length,
    events: calendarEvents
  });
});

// Send reminder notifications to pending invitees
export const sendVargReminders = asyncErrorHandler(async (req, res, next) => {
  const { vargId } = req.params;
  const user = req.user;

  // Find the varg
  const varg = await Varg.findById(vargId);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Check if varg is approved
  if (!varg.superAdminApproved) {
    return next(new ErrorHandler('Cannot send reminders for unapproved vargs', 400));
  }

  // Ensure user has permission (creator or appropriate role)
  if (varg.createdBy.toString() !== user._id.toString() && 
      user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('You do not have permission to send reminders for this varg', 403));
  }

  // Find all pending invitations
  const pendingInvitations = await VargInvitation.find({
    vargId: vargId,
    status: 'pending',
    notificationSent: true // Ensure initial notification was sent
  }).populate('invitedUser', 'userName _id');

  if (pendingInvitations.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No pending invitations to send reminders for',
      remindersSent: 0
    });
  }

  // Get the varg details to include in the reminder
  const vargCreator = await User.findById(varg.createdBy);
  const creatorName = vargCreator ? vargCreator.userName : "An administrator";

  // Prepare location/platform details
  let locationDetails = '';
  if (varg.vargType === 'Online') {
    locationDetails = `Platform: ${varg.platform}, Meeting URL: ${varg.meetingUrl}`;
  } else {
    locationDetails = `Location: ${varg.location}`;
  }

  let remindersSent = 0;

  // Send reminder notifications
  for (const invitation of pendingInvitations) {
    if (invitation.invitedUser) {
      const reminderMessage = `REMINDER: You have not yet responded to ${creatorName}'s invitation to attend "${varg.name}" on ${new Date(varg.startDate).toLocaleDateString()}. ${locationDetails}`;

      await sendNotification(
        invitation.invitedUser._id.toString(),
        'Varg Invitation Reminder',
        reminderMessage,
        {
          type: 'VARG_INVITATION_REMINDER',
          vargId: varg._id.toString(),
          invitationId: invitation._id.toString(),
          responseOptions: [
            { value: 'accepted', label: 'Accept' },
            { value: 'rejected', label: 'Reject', requiresReason: true },
            { value: 'maybe', label: 'Maybe' }
          ],
          rejectionReasons: [
            { value: 'Death', label: 'Death' },
            { value: 'Casualty', label: 'Casualty' },
            { value: 'Accident', label: 'Accident' },
            { value: 'Illness', label: 'Illness' },
            { value: 'Function', label: 'Function' },
            { value: 'Marriage', label: 'Marriage' },
            { value: 'Other', label: 'Other', allowCustom: true }
          ]
        }
      );

      remindersSent++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully sent reminders to ${remindersSent} pending invitees`,
    remindersSent
  });
});

export const markVargAsUrgent = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Find the varg
  const varg = await Varg.findById(id);

  if (!varg) {
    return next(new ErrorHandler('Varg not found', 404));
  }

  // Verify the user is the creator of the varg
  if (varg.createdBy.toString() !== user._id.toString() && user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('You do not have permission to mark this varg as urgent', 403));
  }

  // Check if varg is already marked as urgent
  if (varg.isUrgent) {
    return next(new ErrorHandler('This varg is already marked as urgent', 400));
  }

  // Update varg to mark as urgent
  varg.isUrgent = true;
  varg.urgencyMarkedBy = user._id;
  varg.urgencyMarkedAt = new Date();
  
  // If varg was already approved, we need to re-check for conflicts and notify users
  const wasApproved = varg.superAdminApproved;
  
  // Save the updated varg
  await varg.save();

  // If the varg was already approved, notify super admin that an approved varg has been marked urgent
  if (wasApproved) {
    // Find all super admins
    const superAdmins = await User.find({ role: { $in: ['superAdmin', 'systemAdmin'] } });
    
    for (const admin of superAdmins) {
      await sendNotification(
        admin._id.toString(),
        'Varg Marked as Urgent',
        `A previously approved varg "${varg.name}" has been marked as urgent by ${user.userName}. This may affect other scheduled vargs.`,
        {
          type: 'VARG_MARKED_URGENT',
          vargId: varg._id.toString(),
          action: 'review'
        }
      );
    }
    
    // Check for conflicts with other vargs
    const areaIds = {};
    if (varg.anchalAreaId) areaIds.anchalAreaId = varg.anchalAreaId;
    else if (varg.sankulAreaId) areaIds.sankulAreaId = varg.sankulAreaId;
    else if (varg.sanchAreaId) areaIds.sanchAreaId = varg.sanchAreaId;
    else if (varg.upSanchAreaId) areaIds.upSanchAreaId = varg.upSanchAreaId;
    
    const conflictingVargs = await checkVargConflicts(varg.startDate, varg.endDate, areaIds, varg._id);
    
    // Notify creators of conflicting vargs
    for (const conflictingVarg of conflictingVargs) {
      const conflictCreator = await User.findById(conflictingVarg.createdBy);
      if (conflictCreator) {
        await sendNotification(
          conflictCreator._id.toString(),
          'Urgent Varg Scheduled During Your Varg',
          `A varg "${varg.name}" has been marked as urgent and overlaps with your varg "${conflictingVarg.name}" (${new Date(conflictingVarg.startDate).toLocaleDateString()} to ${new Date(conflictingVarg.endDate).toLocaleDateString()}).`,
          {
            type: 'URGENT_VARG_OVERLAP',
            vargId: varg._id.toString(),
            conflictingVargId: conflictingVarg._id.toString()
          }
        );
      }
    }
  } else {
    // Not yet approved, just notify the super admins about the urgency
    const superAdmins = await User.find({ role: { $in: ['superAdmin', 'systemAdmin'] } });
    
    for (const admin of superAdmins) {
      await sendNotification(
        admin._id.toString(),
        'Urgent Varg Approval Needed',
        `A varg "${varg.name}" has been marked as urgent and requires your approval.`,
        {
          type: 'VARG_APPROVAL_NEEDED',
          vargId: varg._id.toString(),
          isUrgent: true
        }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: 'Varg marked as urgent successfully',
    varg
  });
});