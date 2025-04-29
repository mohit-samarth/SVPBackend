import mongoose from 'mongoose';
import { sendNotification } from '../../utils/notificationService.js';
import { User } from '../../models/userRoles/userSchema.js';
import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import cron from 'node-cron';
import { GramSamiti } from '../../models/gramSamiti/gramSamitiSchema.js';



export const notifyGramSamitiCreation = async (gramSamiti, members, isNewSamiti = true) => {
  try {
    if (!gramSamiti || !members || members.length === 0) {
      console.log('Invalid parameters for gram samiti notifications');
      return;
    }

    console.log(`Preparing to send notifications for Gram Samiti: ${gramSamiti._id}`);
    
    // Extract area IDs from the Gram Samiti
    const {
      upSanchAreaId,
      sanchAreaId,
      sankulAreaId,
      anchalAreaId,
      village,
      gramPanchayat,
      svpId
    } = gramSamiti;

    // Find hierarchy officers responsible for this area
    const hierarchyUsers = await User.find({
      $or: [
        { role: 'upSanchPramukh', upSanchAreaId: upSanchAreaId },
        { role: 'sanchPramukh', sanchAreaId: sanchAreaId },
        { role: 'sankulPramukh', sankulAreaId: sankulAreaId },
        { role: 'anchalPramukh', anchalAreaId: anchalAreaId },
        // Include system admins and super admins
        { role: { $in: ['systemAdmin', 'superAdmin'] } }
      ],
      isDeleted: false
    }).select('_id role userName svpEmail');

    if (hierarchyUsers.length === 0) {
      console.log('No hierarchy users found to notify');
      return;
    }

    console.log(`Found ${hierarchyUsers.length} hierarchy users to notify`);

    // Create role mapping for notifications in English
    const roleTitles = {
      'Pradhan': 'Pradhan',
      'Uppradhan': 'Uppradhan',
      'Sachiv': 'Sachiv',
      'Upsachiv': 'Upsachiv',
      'Sadasya1': 'Sadasya1',
      'Sadasya2': 'Sadasya2',
      'Sadasya3': 'Sadasya3'
    };

    // Group members by their roles for notification
    const membersByRole = {};
    members.forEach(member => {
      if (member && member.designationInSvpGramSamii) {
        const fullName = `${member.firstName} ${member.middleName || ''} ${member.lastName}`.trim();
        membersByRole[member.designationInSvpGramSamii] = fullName;
      }
    });

    // Create notification content in English
    const notificationTitle = isNewSamiti 
      ? `New Gram Samiti Created: ${village}`
      : `Gram Samiti Updated: ${village}`;
    
    // Create notification body with member details in English
    let notificationBody = isNewSamiti
      ? `Members of the new Gram Samiti in ${village}, ${gramPanchayat} are as follows:\n\n`
      : `Gram Samiti member information for ${village}, ${gramPanchayat} has been updated:\n\n`;
    
    // Add member details to notification body
    Object.entries(membersByRole).forEach(([role, name]) => {
      if (roleTitles[role] && name) {
        notificationBody += `${roleTitles[role]}: ${name}\n`;
      }
    });

    // Add SVP ID if available
    if (svpId) {
      notificationBody += `\nSVP ID: ${svpId}`;
    }

    // Create notification data payload
    const notificationData = {
      type: 'GRAM_SAMITI_UPDATE',
      gramSamitiId: gramSamiti._id.toString(),
      village: village,
      gramPanchayat: gramPanchayat,
      action: isNewSamiti ? 'created' : 'updated'
    };

    // Send notifications to each hierarchy user
    const notifications = [];
    for (const user of hierarchyUsers) {
      console.log(`Sending notification to ${user.role} ${user.userName} (${user._id})`);
      
      try {
        const notification = await sendNotification(
          user._id,
          notificationTitle,
          notificationBody,
          notificationData
        );
        
        notifications.push(notification);
        console.log(`Successfully sent notification to user ${user._id}`);
      } catch (error) {
        console.error(`Failed to send notification to user ${user._id}:`, error);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error in notifyGramSamitiCreation:', error);
  }
};

export const addGramSamitiNotifications = asyncErrorHandler(async (req, res, next) => {
  // Check if we have a valid response with gram samiti data
  if (res.locals && res.locals.data && res.locals.data.gramSamiti && res.locals.data.members) {
    const { gramSamiti, members, isComplete } = res.locals.data;
    const isNewSamiti = !req.body.gramSamitiId; // Check if this was a new creation
    
    try {
      // Send notifications asynchronously so it doesn't block the response
      notifyGramSamitiCreation(gramSamiti, members, isNewSamiti)
        .then(notifications => {
          console.log(`Sent ${notifications?.length || 0} notifications for Gram Samiti ${gramSamiti._id}`);
        })
        .catch(error => {
          console.error('Error sending Gram Samiti notifications:', error);
        });
    } catch (error) {
      console.error('Error in notification middleware:', error);
      // Don't block the response even if notifications fail
    }
  }
  
  // Continue with the response that was already prepared
  return next();
});

export const scheduleGramSamitiStatusNotifications = () => {
  // Schedule to run every hour ('0 * * * *')
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running scheduled Gram Samiti status check...');
      await sendGramSamitiStatusNotifications();
    } catch (error) {
      console.error('Error in scheduled Gram Samiti notification task:', error);
    }
  });

  console.log('Gram Samiti hourly status notification scheduler initialized');
};

export const notifySvpNameUpdate = async (gramSamiti, oldSvpName, newSvpName) => {
  try {
    if (!gramSamiti) {
      console.log('Invalid parameters for SVP name update notification');
      return;
    }

    console.log(`Preparing to send notifications for SVP name update in Gram Samiti: ${gramSamiti._id}`);
    
    // Extract area IDs from the Gram Samiti
    const {
      upSanchAreaId,
      sanchAreaId,
      sankulAreaId,
      anchalAreaId,
      village,
      gramPanchayat,
      svpId
    } = gramSamiti;

    // Find hierarchy officers responsible for this area
    const hierarchyUsers = await User.find({
      $or: [
        { role: 'upSanchPramukh', upSanchAreaId: upSanchAreaId },
        { role: 'sanchPramukh', sanchAreaId: sanchAreaId },
        { role: 'sankulPramukh', sankulAreaId: sankulAreaId },
        { role: 'anchalPramukh', anchalAreaId: anchalAreaId },
        // Include system admins and super admins
        { role: { $in: ['systemAdmin', 'superAdmin'] } }
      ],
      isDeleted: false
    }).select('_id role userName svpEmail');

    if (hierarchyUsers.length === 0) {
      console.log('No hierarchy users found to notify');
      return;
    }

    console.log(`Found ${hierarchyUsers.length} hierarchy users to notify about SVP name update`);

    // Create notification content
    const notificationTitle = `SVP Name Updated: ${village}`;
    
    // Create notification body with SVP name change details
    // let notificationBody = `The SVP name for Gram Samiti in ${village}, ${gramPanchayat} has been updated:\n\n`;
    let notificationBody = `The SVP name for Gram Samiti in ${village} has been updated:\n\n`;
    notificationBody += `Previous Name: ${oldSvpName || 'Not set'}\n`;
    notificationBody += `New Name: ${newSvpName}\n\n`;
    
    // Add SVP ID if available
    if (svpId) {
      notificationBody += `SVP ID: ${svpId}`;
    }

    // Create notification data payload
    const notificationData = {
      type: 'SVP_NAME_UPDATE',
      gramSamitiId: gramSamiti._id.toString(),
      village: village,
      gramPanchayat: gramPanchayat,
      oldSvpName: oldSvpName,
      newSvpName: newSvpName
    };

    // Send notifications to each hierarchy user
    const notifications = [];
    for (const user of hierarchyUsers) {
      console.log(`Sending SVP name update notification to ${user.role} ${user.userName} (${user._id})`);
      
      try {
        const notification = await sendNotification(
          user._id,
          notificationTitle,
          notificationBody,
          notificationData
        );
        
        notifications.push(notification);
        console.log(`Successfully sent SVP name update notification to user ${user._id}`);
      } catch (error) {
        console.error(`Failed to send SVP name update notification to user ${user._id}:`, error);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error in notifySvpNameUpdate:', error);
  }
};

export const sendGramSamitiStatusNotifications = async () => {
  try {
    // Find all Gram Samitis, both complete and incomplete
    const allGramSamitis = await GramSamiti.find()
      .populate([
        { path: 'upSanchAreaId', select: 'upSanchName' },
        { path: 'sanchAreaId', select: 'sanchName' },
        { path: 'sankulAreaId', select: 'sankulName' },
        { path: 'anchalAreaId', select: 'anchalName' }
      ]);

    if (!allGramSamitis.length) {
      console.log('No Gram Samitis found to process');
      return;
    }

    console.log(`Found ${allGramSamitis.length} Gram Samitis to process`);

    // Group Gram Samitis by hierarchy levels
    const hierarchyGroups = {
      upSanch: {},
      sanch: {},
      sankul: {},
      anchal: {}
    };

    // Calculate statistics for each Gram Samiti
    allGramSamitis.forEach(gs => {
      // Count filled roles
      const filledRolesCount = [
        'gsMemberPradhanId', 
        'gsMemberUppradhanId', 
        'gsMemberSachivId', 
        'gsMemberUpsachivId',
        'gsMemberSadasya1Id',
        'gsMemberSadasya2Id',
        'gsMemberSadasya3Id'
      ].filter(role => gs[role]).length;
      
      const completionPercentage = Math.round((filledRolesCount / 7) * 100);
      const pendingRolesCount = 7 - filledRolesCount;

      // Organize by hierarchical areas
      if (gs.upSanchAreaId && gs.upSanchAreaId._id) {
        const upSanchId = gs.upSanchAreaId._id.toString();
        if (!hierarchyGroups.upSanch[upSanchId]) {
          hierarchyGroups.upSanch[upSanchId] = {
            name: gs.upSanchAreaId.upSanchName,
            total: 0,
            complete: 0,
            incomplete: 0,
            svpIds: new Set(),
            detailedStats: []
          };
        }
        
        hierarchyGroups.upSanch[upSanchId].total++;
        hierarchyGroups.upSanch[upSanchId].svpIds.add(gs.svpId);
        
        if (gs.isComplete) {
          hierarchyGroups.upSanch[upSanchId].complete++;
        } else {
          hierarchyGroups.upSanch[upSanchId].incomplete++;
        }
        
        hierarchyGroups.upSanch[upSanchId].detailedStats.push({
          svpId: gs.svpId,
          village: gs.village,
          isComplete: gs.isComplete,
          filledRoles: filledRolesCount,
          pendingRoles: pendingRolesCount,
          completionPercentage
        });
      }

      // Similar grouping for Sanch level
      if (gs.sanchAreaId && gs.sanchAreaId._id) {
        const sanchId = gs.sanchAreaId._id.toString();
        if (!hierarchyGroups.sanch[sanchId]) {
          hierarchyGroups.sanch[sanchId] = {
            name: gs.sanchAreaId.sanchName,
            total: 0,
            complete: 0,
            incomplete: 0,
            svpIds: new Set(),
            detailedStats: []
          };
        }
        
        hierarchyGroups.sanch[sanchId].total++;
        hierarchyGroups.sanch[sanchId].svpIds.add(gs.svpId);
        
        if (gs.isComplete) {
          hierarchyGroups.sanch[sanchId].complete++;
        } else {
          hierarchyGroups.sanch[sanchId].incomplete++;
        }
        
        hierarchyGroups.sanch[sanchId].detailedStats.push({
          svpId: gs.svpId,
          village: gs.village,
          isComplete: gs.isComplete,
          filledRoles: filledRolesCount,
          pendingRoles: pendingRolesCount,
          completionPercentage
        });
      }

      // Similar grouping for Sankul level
      if (gs.sankulAreaId && gs.sankulAreaId._id) {
        const sankulId = gs.sankulAreaId._id.toString();
        if (!hierarchyGroups.sankul[sankulId]) {
          hierarchyGroups.sankul[sankulId] = {
            name: gs.sankulAreaId.sankulName,
            total: 0,
            complete: 0,
            incomplete: 0,
            svpIds: new Set(),
            detailedStats: []
          };
        }
        
        hierarchyGroups.sankul[sankulId].total++;
        hierarchyGroups.sankul[sankulId].svpIds.add(gs.svpId);
        
        if (gs.isComplete) {
          hierarchyGroups.sankul[sankulId].complete++;
        } else {
          hierarchyGroups.sankul[sankulId].incomplete++;
        }
        
        hierarchyGroups.sankul[sankulId].detailedStats.push({
          svpId: gs.svpId,
          village: gs.village,
          isComplete: gs.isComplete,
          filledRoles: filledRolesCount,
          pendingRoles: pendingRolesCount,
          completionPercentage
        });
      }

      // Similar grouping for Anchal level
      if (gs.anchalAreaId && gs.anchalAreaId._id) {
        const anchalId = gs.anchalAreaId._id.toString();
        if (!hierarchyGroups.anchal[anchalId]) {
          hierarchyGroups.anchal[anchalId] = {
            name: gs.anchalAreaId.anchalName,
            total: 0,
            complete: 0,
            incomplete: 0,
            svpIds: new Set(),
            detailedStats: []
          };
        }
        
        hierarchyGroups.anchal[anchalId].total++;
        hierarchyGroups.anchal[anchalId].svpIds.add(gs.svpId);
        
        if (gs.isComplete) {
          hierarchyGroups.anchal[anchalId].complete++;
        } else {
          hierarchyGroups.anchal[anchalId].incomplete++;
        }
        
        hierarchyGroups.anchal[anchalId].detailedStats.push({
          svpId: gs.svpId,
          village: gs.village,
          isComplete: gs.isComplete,
          filledRoles: filledRolesCount,
          pendingRoles: pendingRolesCount,
          completionPercentage
        });
      }
    });

    // Find all hierarchy officials
    const officials = await User.find({
      role: { $in: ['upSanchPramukh', 'sanchPramukh', 'sankulPramukh', 'anchalPramukh', 'systemAdmin', 'superAdmin'] },
      isDeleted: false
    }).select('_id role userName svpEmail upSanchAreaId sanchAreaId sankulAreaId anchalAreaId');

    console.log(`Found ${officials.length} officials to notify`);

    // Generate and send notifications for each official based on their role and area
    for (const official of officials) {
      let targetData = null;
      let areaName = '';
      let groupType = '';

      // Determine what area data to use based on official's role
      if (official.role === 'upSanchPramukh' && official.upSanchAreaId) {
        const upSanchId = official.upSanchAreaId.toString();
        targetData = hierarchyGroups.upSanch[upSanchId];
        groupType = 'UpSanch';
        if (targetData) areaName = targetData.name;
      }
      else if (official.role === 'sanchPramukh' && official.sanchAreaId) {
        const sanchId = official.sanchAreaId.toString();
        targetData = hierarchyGroups.sanch[sanchId];
        groupType = 'Sanch';
        if (targetData) areaName = targetData.name;
      }
      else if (official.role === 'sankulPramukh' && official.sankulAreaId) {
        const sankulId = official.sankulAreaId.toString();
        targetData = hierarchyGroups.sankul[sankulId];
        groupType = 'Sankul';
        if (targetData) areaName = targetData.name;
      }
      else if (official.role === 'anchalPramukh' && official.anchalAreaId) {
        const anchalId = official.anchalAreaId.toString();
        targetData = hierarchyGroups.anchal[anchalId];
        groupType = 'Anchal';
        if (targetData) areaName = targetData.name;
      }
      // For system admins and super admins, prepare a global summary
      else if (['systemAdmin', 'superAdmin'].includes(official.role)) {
        const globalStats = {
          total: allGramSamitis.length,
          complete: allGramSamitis.filter(gs => gs.isComplete).length,
          incomplete: allGramSamitis.filter(gs => !gs.isComplete).length,
          svpIds: new Set(allGramSamitis.map(gs => gs.svpId))
        };
        
        targetData = globalStats;
        groupType = 'System';
        areaName = 'All Areas';
      }

      // Skip if no relevant data for this official
      if (!targetData) {
        console.log(`No relevant data found for ${official.role} ${official.userName}`);
        continue;
      }

      // Create notification content in English
      const notificationTitle = `Gram Samiti Status Update - ${areaName}`;
      
      let notificationBody;
      
      if (groupType === 'System') {
        // System admin and super admin get overall stats
        notificationBody = `
Hourly Gram Samiti Status Report:

Total Gram Samitis: ${targetData.total}
Complete: ${targetData.complete} (${Math.round((targetData.complete / targetData.total) * 100)}%)
Incomplete: ${targetData.incomplete} (${Math.round((targetData.incomplete / targetData.total) * 100)}%)
SVPs Involved: ${targetData.svpIds.size}

Please check the dashboard for detailed information.`;
      } else {
        // Regional officials get stats for their area
        notificationBody = `
${groupType} Status Report for ${areaName}:

Total Gram Samitis: ${targetData.total}
Complete: ${targetData.complete} (${Math.round((targetData.complete / targetData.total) * 100)}%)
Incomplete: ${targetData.incomplete} (${Math.round((targetData.incomplete / targetData.total) * 100)}%)
SVPs Involved: ${targetData.svpIds.size}

Top pending Gram Samitis:`;

        // Add details for up to 3 pending Gram Samitis with lowest completion
        const pendingGramSamitis = targetData.detailedStats
          .filter(stat => !stat.isComplete)
          .sort((a, b) => a.completionPercentage - b.completionPercentage)
          .slice(0, 3);

        if (pendingGramSamitis.length > 0) {
          pendingGramSamitis.forEach(gs => {
            notificationBody += `
- SVP ID: ${gs.svpId}, Village: ${gs.village}
  Filled: ${gs.filledRoles}/7 roles (${gs.completionPercentage}%)`;
          });
        } else {
          notificationBody += `
No pending Gram Samitis in this area.`;
        }
      }

      // Add notification data
      const notificationData = {
        type: 'PENDING_GRAM_SAMITI',
        areaType: groupType,
        areaName: areaName,
        totalCount: targetData.total,
        completeCount: targetData.complete,
        incompleteCount: targetData.incomplete,
        timestamp: new Date().toISOString()
      };

      // Send notification
      try {
        console.log(`Sending notification to ${official.role} ${official.userName} (${official._id})`);
        const notification = await sendNotification(
          official._id,
          notificationTitle,
          notificationBody,
          notificationData
        );
        console.log(`Successfully sent notification to ${official.role} ${official.userName}`);
      } catch (error) {
        console.error(`Failed to send notification to ${official.role} ${official.userName}:`, error);
      }
    }

    console.log('Completed sending Gram Samiti status notifications');
  } catch (error) {
    console.error('Error in sendGramSamitiStatusNotifications:', error);
    throw error;
  }
};

export const notifyFormCreation = async (form, creator, gramSamiti) => {
  try {
    if (!form) {
      console.log('Invalid form for notifications');
      return;
    }

    console.log(`Preparing to send notifications for Form: ${form._id}`);
    
    // Extract area IDs from the form
    const {
      upSanchAreaId,
      sanchAreaId,
      sankulAreaId,
      anchalAreaId,
      village,
      grampanchayat,
      svpId,
      firstName,
      middleName,
      lastName
    } = form;

    // Find hierarchy officers responsible for this area
    const hierarchyUsers = await User.find({
      $or: [
        { role: 'upSanchPramukh', upSanchAreaId: upSanchAreaId },
        { role: 'sanchPramukh', sanchAreaId: sanchAreaId },
        { role: 'sankulPramukh', sankulAreaId: sankulAreaId },
        { role: 'anchalPramukh', anchalAreaId: anchalAreaId },
        // Include system admins and super admins
        { role: { $in: ['systemAdmin', 'superAdmin'] } }
      ],
      isDeleted: false
    }).select('_id role userName svpEmail');

    // If gramSamiti exists, add Pradhan to notification recipients
    if (gramSamiti && gramSamiti.gsMemberPradhanId) {
      const pradhan = await User.findOne({ 
        _id: gramSamiti.gsMemberPradhanId,
        isDeleted: false
      }).select('_id role userName svpEmail');
      
      if (pradhan) {
        hierarchyUsers.push(pradhan);
      }
    }

    if (hierarchyUsers.length === 0) {
      console.log('No hierarchy users found to notify');
      return;
    }

    console.log(`Found ${hierarchyUsers.length} hierarchy users to notify`);

    // Prepare the full name of the person in the form
    const formFullName = `${firstName || ''}  ${lastName || ''}`.trim();
    
    // Create notification content
    const notificationTitle = `New Aacharya Recommendation: ${formFullName}`;
    
    // Create notification body with form details
    let notificationBody = `A new form has been created for ${formFullName}.\n\n`;
    
    // Add village and grampanchayat if available
    if (village && grampanchayat) {
      notificationBody += `Village: ${village}\n`;
    }
    
    // Add creator info
    if (creator && creator.userName) {
      notificationBody += `\nCreated by: ${creator.userName}`;
    }
    
    // Add SVP ID if available
    if (svpId) {
      notificationBody += `\nSVP ID: ${svpId}`;
    }

    // Create notification data payload
    const notificationData = {
      type: 'KIF_FORM_CREATED',
      formId: form._id.toString(),
      village: village || '',
      gramPanchayat: grampanchayat || '',
      action: 'created'
    };

    // Send notifications to each hierarchy user
    const notifications = [];
    for (const user of hierarchyUsers) {
      console.log(`Sending notification to ${user.role} ${user.userName} (${user._id})`);
      
      try {
        const notification = await sendNotification(
          user._id,
          notificationTitle,
          notificationBody,
          notificationData
        );
        
        notifications.push(notification);
        console.log(`Successfully sent notification to user ${user._id}`);
      } catch (error) {
        console.error(`Failed to send notification to user ${user._id}:`, error);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error in notifyFormCreation:', error);
  }
};

export default scheduleGramSamitiStatusNotifications;
