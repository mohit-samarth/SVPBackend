import Form from '../../models/userKifs/acharyaKifSchema.js';
import { GramSamiti } from '../../models/gramSamiti/gramSamitiSchema.js';

import { sendNotification } from '../../utils/notificationService.js';
import { User } from '../../models/userRoles/userSchema.js'
import mongoose from 'mongoose';
import { Notification } from '../../models/notification/notificationSchema.js';
import { notifyFormCreation } from '../../utils/Notifications/notificationsmiddleware.js';

// export const createForm = async (req, res) => {
//   try {
//     // Get the user information from authenticated request
//     const user = req.user;
    
//     // Log the incoming request body for debugging
//     console.log('Received form data:', req.body);
    
//     // Extract fields from req.body with fallbacks for missing values
//     const {
//       firstName,
//       middleName,
//       lastName,
//       gender,
//       customGender,
//       nationality,
//       state,
//       district,
//       taluka,
//       village,
//       pincode,
//       grampanchayat,
//       primaryPhoneType,
//       countryCode,
//       primaryPhoneNumber,
//       Familyphonenumber,
//       primaryPhoneRelation,
//       primaryPhoneRelationOther,
//       isWhatsApp,
//       whatsAppNumber,
//       gsMemberPradhanId
//     } = req.body;

//      // First, find the GramSamiti document to get the svpId
//      const pradhanId = gsMemberPradhanId || user.gsMemberPradhanId;
//      let svpId = null;
     
//      if (pradhanId) {
//        const gramSamiti = await GramSamiti.findOne({ gsMemberPradhanId: pradhanId });
//        if (gramSamiti) {
//          svpId = gramSamiti.svpId;
//          console.log('Found svpId from GramSamiti:', svpId);
//        } else {
//          console.log('GramSamiti not found for pradhanId:', pradhanId);
//        }
//      } else {
//        console.log('No pradhanId provided, svpId will be null');
//      }
    
//     // Create form with all required fields
//     const newForm = new Form({
//       // Personal details
//       firstName: firstName || '',
//       middleName: middleName || '',
//       lastName: lastName || '',
//       gender: gender || '',
//       customGender: customGender || '',
//       nationality: nationality || 'India',
      
//       // Communication details
//       state: state || '',
//       district: district || '',
//       taluka: taluka || '',
//       village: village || '',
//       pincode: pincode || '',
//       grampanchayat: grampanchayat || '',
//       primaryPhoneType: primaryPhoneType || 'own', 
//       countryCode: countryCode || '+91',
//       primaryPhoneNumber: primaryPhoneNumber || '',
//       Familyphonenumber: Familyphonenumber || '',
//       primaryPhoneRelation: primaryPhoneRelation || '',
//       primaryPhoneRelationOther: primaryPhoneRelationOther || '',
//       isWhatsApp: isWhatsApp || false,
//       whatsAppNumber: whatsAppNumber || '',
//       // Additional metadata
//       createdBy: user._id,
//       isPartialKif: true,
//       status: 'partial'|| '',
//       upSanchAreaId: user.upSanchAreaId,
//       anchalAreaId: user.anchalAreaId,
//       sankulAreaId: user.sankulAreaId,
//       sanchAreaId: user.sanchAreaId,
//       gsMemberPradhanId: pradhanId,
//       svpId: svpId // Store the SVP ID from the GramSamiti
//     });

//     // Save the form
//     const savedForm = await newForm.save();
//     console.log('Form saved successfully:', savedForm);
    
//     // Log whether svpId was stored correctly in the saved form
//     console.log('svpId in saved form:', savedForm.svpId);
    
//     res.status(201).json({ 
//       message: 'Form created successfully', 
//       form: savedForm 
//     });
//   } catch (err) {
//     console.error('Error while creating form:', err);
//     res.status(500).json({ 
//       message: 'Error creating form', 
//       error: err.message 
//     });
//   }
// };


export const createForm = async (req, res) => {
  try {
    // Get the user information from authenticated request
    const user = req.user;
    
    // Log the incoming request body for debugging
    console.log('Received form data:', req.body);
    
    // Extract fields from req.body with fallbacks for missing values
    const {
      firstName,
      middleName,
      lastName,
      gender,
      customGender,
      nationality,
      state,
      district,
      taluka,
      village,
      pincode,
      grampanchayat,
      primaryPhoneType,
      countryCode,
      primaryPhoneNumber,
      Familyphonenumber,
      primaryPhoneRelation,
      primaryPhoneRelationOther,
      isWhatsApp,
      whatsAppNumber,
      gsMemberPradhanId
    } = req.body;

     // First, find the GramSamiti document to get the svpId
     const pradhanId = gsMemberPradhanId || user.gsMemberPradhanId;
     let svpId = null;
     let gramSamiti = null;
     
     if (pradhanId) {
       gramSamiti = await GramSamiti.findOne({ gsMemberPradhanId: pradhanId });
       if (gramSamiti) {
         svpId = gramSamiti.svpId;
         console.log('Found svpId from GramSamiti:', svpId);
       } else {
         console.log('GramSamiti not found for pradhanId:', pradhanId);
       }
     } else {
       console.log('No pradhanId provided, svpId will be null');
     }
    
    // Create form with all required fields
    const newForm = new Form({
      // Personal details
      firstName: firstName || '',
      middleName: middleName || '',
      lastName: lastName || '',
      gender: gender || '',
      customGender: customGender || '',
      nationality: nationality || 'India',
      
      // Communication details
      state: state || '',
      district: district || '',
      taluka: taluka || '',
      village: village || '',
      pincode: pincode || '',
      grampanchayat: grampanchayat || '',
      primaryPhoneType: primaryPhoneType || 'own', 
      countryCode: countryCode || '+91',
      primaryPhoneNumber: primaryPhoneNumber || '',
      Familyphonenumber: Familyphonenumber || '',
      primaryPhoneRelation: primaryPhoneRelation || '',
      primaryPhoneRelationOther: primaryPhoneRelationOther || '',
      isWhatsApp: isWhatsApp || false,
      whatsAppNumber: whatsAppNumber || '',
      // Additional metadata
      createdBy: user._id,
      isPartialKif: true,
      status: 'partial',
      upSanchAreaId: user.upSanchAreaId,
      anchalAreaId: user.anchalAreaId,
      sankulAreaId: user.sankulAreaId,
      sanchAreaId: user.sanchAreaId,
      gsMemberPradhanId: pradhanId,
      svpId: svpId // Store the SVP ID from the GramSamiti
    });

    // Save the form
    const savedForm = await newForm.save();
    console.log('Form saved successfully:', savedForm);
    
    // Log whether svpId was stored correctly in the saved form
    console.log('svpId in saved form:', savedForm.svpId);
    
    // Send notifications to hierarchy users
    await notifyFormCreation(savedForm, user, gramSamiti);
    
    res.status(201).json({ 
      message: 'Form created successfully', 
      form: savedForm 
    });
  } catch (err) {
    console.error('Error while creating form:', err);
    res.status(500).json({ 
      message: 'Error creating form', 
      error: err.message 
    });
  }
};
export const getAllForms = async (req, res) => {
  try {
    const forms = await Form.find();
    res.status(200).json(forms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forms', error: err.message });
  }
};

// export const getFormsByUpSanch = async (req, res) => {
//   try {
//     const upSanchId = req.params.upSanchId || req.user.upSanchAreaId;

//     const kifs = await Form.find({ 
//       upSanchAreaId: upSanchId,
//       isDeleted: false
//     }).populate('createdBy', 'userName');

//     res.status(200).json({ kifs });
//   } catch (err) {
//     console.error('Error retrieving KIFs:', err.message);
//     res.status(500).json({ message: 'Error retrieving KIFs', error: err.message });
//   }
// };

export const getSvpIdsByUpSanch = async (req, res) => {
  try {
    // Get the authenticated user from request
    const user = req.user;

    // Ensure user has upSanchAreaId (validation)
    if (!user.upSanchAreaId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not associated with any Upsanch area.'
      });
    }

    // Find all forms with this upSanchAreaId and get unique svpIds
    const distinctSvpIds = await Form.distinct('svpId', {
      upSanchAreaId: user.upSanchAreaId,
      // Only include non-null svpIds
      svpId: { $ne: null }
    });

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        svpIds: distinctSvpIds
      }
    });
  } catch (err) {
    console.error('Error fetching SVP IDs:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SVP IDs',
      error: err.message
    });
  }
};

export const getFormsByUpSanch = async (req, res) => {
  try {
    // Get the authenticated user from request
    const user = req.user;

    // Ensure user has upSanchAreaId (validation)
    if (!user.upSanchAreaId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not associated with any Upsanch area.'
      });
    }

    // Query parameters for filtering
    const { status, startDate, endDate, svpId, limit = 10, page = 1 } = req.query;

    // Build query object
    const query = {
      upSanchAreaId: user.upSanchAreaId
    };

    // Add SVP ID filter if provided
    if (svpId) {
      query.svpId = svpId;
    }

    // Add optional filters if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find forms matching the query
    const forms = await Form.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name userName'); // Include creator information

    // Get total count for pagination
    const totalForms = await Form.countDocuments(query);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalForms / parseInt(limit));

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        forms,
        pagination: {
          totalForms,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching Upsanch KIF forms:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Upsanch KIF forms',
      error: err.message
    });
  }
};

export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching form', error: err.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    // Add isUpdated to the req.body
    req.body.isUpdated = true;
    // Map 'pass' to 'passed' if necessary
    if (req.body.exam1Status === 'pass') req.body.exam1Status = 'passed';
    if (req.body.exam2Status === 'pass') req.body.exam2Status = 'passed';
    
    // Remove 'on_hold' if it's not a valid value for interviewStatus
    if (req.body.interviewStatus === 'on_hold') delete req.body.interviewStatus;
    
    
    
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Handling uploaded files
    if (req.files.photo) {
      form.photo = req.files.photo[0].path;
    }
    if (req.files.certificationFile) {
      form.certificationFile = req.files.certificationFile[0].path;
    }
    if (req.files.licenseFile) {
      form.licenseFile = req.files.licenseFile[0].path;
    }
  
    if (req.files.numberplatephoto) {
      form.vehicles = form.vehicles.map((vehicle, index) => {
        return {
          ...vehicle,
          numberplatephoto: req.files.numberplatephoto[index]?.path || '',
        };
      });
    }
   
    await form.save();
    res.status(200).json({ message: 'Form updated successfully', form });
  } catch (err) {
    res.status(500).json({ message: 'Error updating form', error: err.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting form', error: err.message });
  }
};

// // Update the KIF status to mark interview as completed
// export const markInterviewCompleted = async (req, res) => {
//   try {
//     const { formId } = req.params;
//     const { interviewCompleted, interviewNotes } = req.body;

//     // Validate formId
//     if (!mongoose.Types.ObjectId.isValid(formId)) {
//       return res.status(400).json({ message: 'Invalid form ID' });
//     }

//     // Find the form
//     const form = await Form.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }

//     // // Check if user has permission (based on hierarchy)
//     // if (!hasPermissionToUpdateForm(req.user, form)) {
//     //   return res.status(403).json({ message: 'You do not have permission to update this form' });
//     // }

//     // Update the form with interview status
//     form.interviewCompleted = interviewCompleted || false;
//     form.interviewNotes = interviewNotes || '';
//     form.interviewCompletedBy = req.user._id;
//     form.interviewCompletedAt = new Date();

//     // If the form was partial and now interview is completed, update the status
//     if (form.isPartialKif && interviewCompleted) {
//       form.status = 'interview_completed';
//     }

//     await form.save();

//     // Send notification to higher hierarchy if interview is completed
//     if (interviewCompleted) {
//       await sendNotificationsToHierarchy(form, 'INTERVIEW_COMPLETED', 
//         `Interview completed for ${form.firstName}`, 
//         `The interview for ${form.firstName} has been completed by ${req.user.userName}`);
//     }

//     res.status(200).json({ 
//       message: 'Interview status updated successfully', 
//       form 
//     });
//   } catch (err) {
//     console.error('Error updating interview status:', err.message);
//     res.status(500).json({ 
//       message: 'Error updating interview status', 
//       error: err.message 
//     });
//   }
// };

// // Update the KIF status to mark exam as completed
// export const markExamCompleted = async (req, res) => {
//   try {
//     const { formId } = req.params;
//     const { examCompleted, examScore, examNotes } = req.body;

//     // Validate formId
//     if (!mongoose.Types.ObjectId.isValid(formId)) {
//       return res.status(400).json({ message: 'Invalid form ID' });
//     }

//     // Find the form
//     const form = await Form.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }

//     // // Check if user has permission (based on hierarchy)
//     // if (!hasPermissionToUpdateForm(req.user, form)) {
//     //   return res.status(403).json({ message: 'You do not have permission to update this form' });
//     // }

//     // Update the form with exam status
//     form.examCompleted = examCompleted || false;
//     form.examScore = examScore || 0;
//     form.examNotes = examNotes || '';
//     form.examCompletedBy = req.user._id;
//     form.examCompletedAt = new Date();

//     // If interview was already completed and now exam is completed, update the status
//     if (form.interviewCompleted && examCompleted) {
//       form.status = 'assessment_completed';
//     }

//     await form.save();

//     // Send notification to higher hierarchy if exam is completed
//     if (examCompleted) {
//       await sendNotificationsToHierarchy(form, 'EXAM_COMPLETED', 
//         `Exam completed for ${form.firstName}`, 
//         `The exam for ${form.firstName} has been completed with a score of ${examScore}`);
//     }

//     res.status(200).json({ 
//       message: 'Exam status updated successfully', 
//       form 
//     });
//   } catch (err) {
//     console.error('Error updating exam status:', err.message);
//     res.status(500).json({ 
//       message: 'Error updating exam status', 
//       error: err.message 
//     });
//   }
// };

// // Update the KIF to mark final selection status
// export const updateSelectionStatus = async (req, res) => {
//   try {
//     const { formId } = req.params;
//     const { selectionStatus, remarks } = req.body;

//     // Validate inputs
//     if (!['selected', 'rejected', 'on_hold'].includes(selectionStatus)) {
//       return res.status(400).json({ message: 'Invalid selection status' });
//     }

//     // Validate formId
//     if (!mongoose.Types.ObjectId.isValid(formId)) {
//       return res.status(400).json({ message: 'Invalid form ID' });
//     }

//     // Find the form
//     const form = await Form.findById(formId);
//     if (!form) {
//       return res.status(404).json({ message: 'Form not found' });
//     }

//     // // Check if user has permission (based on hierarchy)
//     // if (!hasPermissionToUpdateForm(req.user, form)) {
//     //   return res.status(403).json({ message: 'You do not have permission to update this form' });
//     // }

//     // Check if both interview and exam are completed
//     if (!form.interviewCompleted || !form.examCompleted) {
//       return res.status(400).json({ 
//         message: 'Cannot update selection status until both interview and exam are completed' 
//       });
//     }

//     // Update the form with selection status
//     form.selectionStatus = selectionStatus;
//     form.selectionRemarks = remarks || '';
//     form.selectedBy = req.user._id;
//     form.selectionDate = new Date();
//     form.status = selectionStatus; // Update the overall status to match selection status
//     form.isPartialKif = false; // No longer a partial KIF

//     await form.save();

//     // Send notification based on selection status
//     let notificationType, title, body;

//     switch (selectionStatus) {
//       case 'selected':
//         notificationType = 'CANDIDATE_SELECTED';
//         title = `Candidate ${form.firstName} Selected`;
//         body = `${form.firstName} has been selected to join as an Acharya`;
//         break;
//       case 'rejected':
//         notificationType = 'CANDIDATE_REJECTED';
//         title = `Candidate ${form.firstName} Not Selected`;
//         body = `${form.firstName} has not been selected at this time`;
//         break;
//       case 'on_hold':
//         notificationType = 'CANDIDATE_ON_HOLD';
//         title = `Candidate ${form.firstName} On Hold`;
//         body = `Decision for ${form.firstName} has been put on hold`;
//         break;
//     }

//     await sendNotificationsToHierarchy(form, notificationType, title, body);

//     // Also notify the candidate if they are selected
//     if (selectionStatus === 'selected' && form.createdBy) {
//       await sendNotification(
//         form.createdBy,
//         'Congratulations! You have been selected',
//         'You have been selected to join as an Acharya. Please check your application status.',
//         { type: 'SELECTION_RESULT', formId: form._id.toString() }
//       );
//     }

//     res.status(200).json({ 
//       message: 'Selection status updated successfully', 
//       form 
//     });
//   } catch (err) {
//     console.error('Error updating selection status:', err.message);
//     res.status(500).json({ 
//       message: 'Error updating selection status', 
//       error: err.message 
//     });
//   }
// };

// // Helper function to check if user has permission to update the form
// const hasPermissionToUpdateForm = (user, form) => {
//   // Check if the user has the required role
//   if (['superAdmin',
//     'systemAdmin',
//     'anchalPramukh',
//     'sankulPramukh',
//     'sanchPramukh',
//     'upSanchPramukh',].includes(user.role)) {
//     return true;
//   }

//   // Check based on hierarchy (sanchAreaId, sankulAreaId, etc.)
//   if (user.sanchAreaId && form.sanchAreaId && user.sanchAreaId.equals(form.sanchAreaId)) {
//     return true;
//   }

//   if (user.sankulAreaId && form.sankulAreaId && user.sankulAreaId.equals(form.sankulAreaId)) {
//     return true;
//   }

//   if (user.anchalAreaId && form.anchalAreaId && user.anchalAreaId.equals(form.anchalAreaId)) {
//     return true;
//   }

//   return false;
// };

// // Helper function to send notifications to users in the hierarchy
// const sendNotificationsToHierarchy = async (form, type, title, body) => {
//   try {
//     const { User } = await import('../../models/userRoles/userSchema.js');

//     // Prepare the notification data
//     const notificationData = {
//       type,
//       formId: form._id.toString(),
//       name: form.firstName,
//       status: form.status
//     };

//     // Find users in the hierarchy to notify
//     const usersToNotify = await User.find({
//       $or: [
//         // Users in same sanch with higher roles
//         { sanchAreaId: form.sanchAreaId, role: { $in: ['sanchSanyojak', 'sanchkaryavah'] } },
//         // Users in same sankul with higher roles
//         { sankulAreaId: form.sankulAreaId, role: { $in: ['sankulSanyojak', 'sankulkaryavah'] } },
//         // Users in same anchal with higher roles
//         { anchalAreaId: form.anchalAreaId, role: { $in: ['anchalSanyojak', 'anchalkaryavah'] } },
//         // Admins and superadmins
//         { role: { $in: ['admin', 'superadmin'] } }
//       ]
//     }).select('_id');

//     console.log(`Found ${usersToNotify.length} users to notify about form ${form._id}`);

//     // Send notifications to each user
//     const notificationPromises = usersToNotify.map(user => 
//       sendNotification(user._id, title, body, notificationData)
//     );

//     await Promise.all(notificationPromises);

//     return true;
//   } catch (error) {
//     console.error('Error sending hierarchy notifications:', error);
//     return false;
//   }
// };

// // Get all KIFs with their status for Acharya dashboard
// export const getAcharyaKifs = async (req, res) => {
//   try {
//     const user = req.user;

//     // Define the query based on user's hierarchy
//     const query = {};

//     // Filter based on user's area permissions
//     if (user.upSanchAreaId) query.upSanchAreaId = user.upSanchAreaId;
//     if (user.sanchAreaId) query.sanchAreaId = user.sanchAreaId;
//     if (user.sankulAreaId) query.sankulAreaId = user.sankulAreaId;
//     if (user.anchalAreaId) query.anchalAreaId = user.anchalAreaId;

//     // Higher level admins can see all forms
//     if (!['admin', 'superadmin'].includes(user.role)) {
//       // Add role-based filters if needed
//     }

//     const forms = await Form.find(query)
//       .populate('createdBy', 'name')
//       .populate('interviewCompletedBy', 'name')
//       .populate('examCompletedBy', 'name')
//       .populate('selectedBy', 'name')
//       .sort({ updatedAt: -1 });

//     res.status(200).json({
//       message: 'Forms retrieved successfully',
//       count: forms.length,
//       forms
//     });
//   } catch (err) {
//     console.error('Error retrieving KIF forms:', err.message);
//     res.status(500).json({
//       message: 'Error retrieving KIF forms',
//       error: err.message
//     });
//   }
// };


export const getUpSanchForms = async (req, res) => {
  try {
    const upSanchAreaId = req.user.upSanchAreaId;

    // Find all forms belonging to this UpSanch
    const forms = await Form.find({ upSanchAreaId })
      .populate('createdBy', 'username firstName lastName')
      .select('_id firstName lastName status createdBy createdAt');

    res.status(200).json({
      message: 'UpSanch forms retrieved successfully',
      forms
    });
  } catch (err) {
    console.error('Error fetching UpSanch forms:', err.message);
    res.status(500).json({
      message: 'Error fetching UpSanch forms',
      error: err.message
    });
  }
};

export const getUsernamesBySvpId = async (req, res) => {
  try {
    // Get the svpId from request parameters
    const { svpId } = req.params;

    // Validate svpId is provided
    if (!svpId) {
      return res.status(400).json({
        success: false,
        message: 'SVP ID is required'
      });
    }

    // Log the query being executed
    console.log('Query:', { svpId, isUpdated: true });

    // Find forms with the given svpId and isUpdated: true
    const forms = await Form.find({ 
      svpId,
      isUpdated: true 
    });
    
    console.log(`Found ${forms.length} forms with isUpdated=true for SVP ${svpId}`);
    
    // For debugging, also check how many total forms exist for this SVP
    const totalForms = await Form.countDocuments({ svpId });
    console.log(`Total forms for SVP ${svpId}: ${totalForms}`);

    // Extract user details from the forms
    const userDetails = forms.map(form => ({
      _id: form._id,
      firstName: form.firstName,
      lastName: form.lastName
    }));

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        svpId,
        users: userDetails
      }
    });
  } catch (err) {
    console.error('Error fetching usernames by SVP ID:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch usernames by SVP ID',
      error: err.message
    });
  }
};
// Update interview and assessment status
export const updateAssessmentStatus = async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      interviewStatus,
      exam1Status,
      exam2Status,
      overallStatus
    } = req.body;

    // Validate formId
    if (!formId || !mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        message: 'Invalid form ID'
      });
    }

    // Find form
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: 'Form not found'
      });
    }

    // Update form with assessment details
    const updateData = {
      lastUpdatedBy: req.user._id
    };

    // Add interview status if provided
    if (interviewStatus) {
      updateData.interviewStatus = interviewStatus;
      if (interviewStatus === 'passed') {
        updateData.interviewCompletedAt = new Date();
        updateData.status = 'interview_completed';
      }
    }

    // Add exam statuses if provided
    if (exam1Status) updateData.exam1Status = exam1Status;
    if (exam2Status) updateData.exam2Status = exam2Status;

    // Update overall status if provided (selected, rejected, on_hold)
    if (overallStatus && ['selected', 'rejected', 'on_hold'].includes(overallStatus)) {
      updateData.status = overallStatus;

      // If selected, create notifications for higher hierarchy
      if (overallStatus === 'selected') {
        await createSelectionNotifications(form);
      }
    }

    // Update form
    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      message: 'Assessment status updated successfully',
      form: updatedForm
    });
  } catch (err) {
    console.error('Error updating assessment status:', err.message);
    res.status(500).json({
      message: 'Error updating assessment status',
      error: err.message
    });
  }
};

// Create notifications for higher hierarchy
const createSelectionNotifications = async (form) => {
  try {
    // Get candidate name
    const candidateName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ');

    // Find users to notify based on hierarchy
    const hierarchyUsers = await User.find({

      $or: [
        { sanchAreaId: form.sanchAreaId, role: 'sanchPramukh' },
        { sankulAreaId: form.sankulAreaId, role: 'sankulPramukh' },
        { anchalAreaId: form.anchalAreaId, role: 'anchalPramukh' },
        { role: 'systemAdmin' }
      ]
    }).select('_id');

    // Create notifications for each user
    const notifications = hierarchyUsers.map(user => ({
      userId: user._id,
      title: 'New Acharya Selected',
      message: `${candidateName} has been selected as an Acharya in your area`,
      relatedDocumentId: form._id,
      relatedDocumentType: 'AcharyaKIF'
    }));

    // Save notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return true;
  } catch (error) {
    console.error('Error creating notifications:', error);
    return false;
  }
};

// Get KIF details with assessment status
export const getFormDetails = async (req, res) => {
  try {
    const { formId } = req.params;

    // Find form with populated user info
    const form = await Form.findById(formId)
      .populate('createdBy', 'username firstName lastName')
      .populate('upSanchAreaId', 'name')
      .populate('sanchAreaId', 'name')
      .populate('sankulAreaId', 'name')
      .populate('anchalAreaId', 'name');

    if (!form) {
      return res.status(404).json({
        message: 'Form not found'
      });
    }

    res.status(200).json({
      message: 'Form details retrieved successfully',
      form
    });
  } catch (err) {
    console.error('Error fetching form details:', err.message);
    res.status(500).json({
      message: 'Error fetching form details',
      error: err.message
    });
  }
};

// Get selected Acharyas
export const getSelectedAcharyas = async (req, res) => {
  try {
    // Find all forms with overall status 'selected'
    const forms = await Form.find({ status: 'selected' })
      .populate('createdBy', 'username firstName lastName')
      .populate('upSanchAreaId', 'upSanchName')
      .populate('sanchAreaId', 'sanchName')
      .populate('sankulAreaId', 'sankulName')
      .populate('anchalAreaId', 'anchalName')
      .select('_id firstName svpId svpName middleName lastName status createdBy createdAt upSanchAreaId sanchAreaId sankulAreaId anchalAreaId');

    res.status(200).json({
      message: 'Selected Acharyas retrieved successfully',
      forms
    });
  } catch (err) {
    console.error('Error fetching selected Acharyas:', err.message);
    res.status(500).json({
      message: 'Error fetching selected Acharyas',
      error: err.message
    });
  }
};

// Get rejected Acharyas
export const getRejectedAcharyas = async (req, res) => {
  try {
    // Find all forms with overall status 'rejected'
    const forms = await Form.find({ status: 'rejected' })
      .populate('createdBy', 'username firstName lastName')
      .populate('upSanchAreaId', 'upSanchName')
      .populate('sanchAreaId', 'sanchName')
      .populate('sankulAreaId', 'sankulName')
      .populate('anchalAreaId', 'anchalName')
      .select('_id firstName svpId middleName lastName status createdBy createdAt upSanchAreaId sanchAreaId sankulAreaId anchalAreaId');

    res.status(200).json({
      message: 'Rejected Acharyas retrieved successfully',
      forms
    });
  } catch (err) {
    console.error('Error fetching rejected Acharyas:', err.message);
    res.status(500).json({
      message: 'Error fetching rejected Acharyas',
      error: err.message
    });
  }
};


export const getAcharyasByStatus = async (req, res) => {
  try {
    // Get status from query parameters (default to 'all' if not specified)
    const { status } = req.query;
    
    // Build query based on status parameter
    let query = {};
    if (status && status !== 'all') {
      // If specific status is requested
      if (!['selected', 'rejected', 'on_hold'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status parameter. Must be one of: selected, rejected, on_hold, or all'
        });
      }
      query.status = status;
    }
    
    // Find forms matching the status query
    const forms = await Form.find(query)
      .populate('createdBy', 'username firstName lastName')
      .populate('upSanchAreaId', 'upSanchName')
      .populate('sanchAreaId', 'sanchName')
      .populate('sankulAreaId', 'sankulName')
      .populate('anchalAreaId', 'anchalName')
      .select('_id firstName svpId svpName middleName lastName status createdBy createdAt upSanchAreaId sanchAreaId sankulAreaId anchalAreaId');

    const statusLabel = status === 'all' ? 'All' : 
                        status === 'selected' ? 'Selected' :
                        status === 'rejected' ? 'Rejected' : 'On Hold';
    
    res.status(200).json({
      message: `${statusLabel} Acharyas retrieved successfully`,
      forms
    });
  } catch (err) {
    console.error(`Error fetching Acharyas:`, err.message);
    res.status(500).json({
      message: 'Error fetching Acharyas',
      error: err.message
    });
  }
};