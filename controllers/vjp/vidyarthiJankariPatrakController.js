import { VidyarthiJankariPatrak } from '../../models/vjp/vidyarthiJankariPatrakSchema.js';
import {
  ErrorBadRequestResponseWithData,
  validationErrorWithData,
  ErrorResponse,
  successResponseWithData,
  successResponse,
  ErrorResponseWithData,
} from '../../helpers/apiResponse.js';
import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import { User } from '../../models/userRoles/userSchema.js';
import mongoose from 'mongoose';

export const createVidyarthiJankariPatrak = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const user = req.user;

      // List of required fields
      const requiredFields = [
        'studFirstName',
        'studLastName',
        'dateOfBirth',
        'gender',
        'religion',
        'state',
        'district',
        'village',
        'studentClass',
        'langOfEducation',
        'fatherName',
        'fatherContactNo',
        'motherName',
        'motherContactNo',
      ];

      // Check for missing fields
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      // If any required fields are missing, return error
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }

      // Validate gender "Other" has specification
      if (req.body.gender === 'Other' && !req.body.genderSpecify) {
        return res.status(400).json({
          status: 'error',
          message: 'Please specify gender when selecting "Other"',
        });
      }

      // Destructure request body and files
      const {
        studFirstName,
        studMiddleName,
        studLastName,
        dateOfBirth,
        gender,
        genderSpecify,
        religion,
        state,
        district,
        subDistrict,
        village,
        gramPanchayat,
        studentClass,
        langOfEducation,
        fatherName,
        fatherContactNo,
        motherName,
        motherContactNo,
        occupation,
        // Add manual fields for hierarchy if user context is not available
        aacharyaId,
        upSanchAreaId: providedUpSanchAreaId,
        sanchAreaId: providedSanchAreaId,
        sankulAreaId: providedSankulAreaId,
        anchalAreaId: providedAnchalAreaId,
        svpId: providedSvpId,
        svpName: providedSvpName,
        gsMemberPradhanId,
        createdBy: providedCreatedBy // Get createdBy from body if provided
      } = req.body;

      // Handle file paths for photos and videos
      const studentPhoto = req.files?.studentPhoto
        ? req.files.studentPhoto[0].path
        : undefined;

      const parentPhoto = req.files?.parentPhoto
        ? req.files.parentPhoto[0].path
        : undefined;

      const studentShortVieoAgreeSvpEnroll = req.files
        ?.studentShortVieoAgreeSvpEnroll
        ? req.files.studentShortVieoAgreeSvpEnroll[0].path
        : undefined;

      const parentShortVieoAgreeSvpEnroll = req.files
        ?.parentShortVieoAgreeSvpEnroll
        ? req.files.parentShortVieoAgreeSvpEnroll[0].path
        : undefined;

      // Initialize hierarchy data object
      let hierarchyData = {};
      
      // STEP 1: Get basic hierarchy information either from user or request body
      if (user) {
        console.log("User is authenticated, fetching hierarchy from user object");
        
        // Add createdBy
        hierarchyData.createdBy = user._id;
        
        // Directly use area IDs from user object if they exist
        if (user.upSanchAreaId) hierarchyData.upSanchAreaId = user.upSanchAreaId;
        if (user.sanchAreaId) hierarchyData.sanchAreaId = user.sanchAreaId;
        if (user.sankulAreaId) hierarchyData.sankulAreaId = user.sankulAreaId;
        if (user.anchalAreaId) hierarchyData.anchalAreaId = user.anchalAreaId;
        
        // Set svpId and svpName if available in user object
        if (user.svpId) hierarchyData.svpId = user.svpId;
        if (user.svpName) hierarchyData.svpName = user.svpName;
        
        // Set role-based ID
        if (user.role === 'aacharya') {
          hierarchyData.aacharyaId = user._id;
          
          // If user is aacharya but doesn't have svpId in their user object,
          // check if they have a createdFromAacharyaKifId and fetch SVP details from there
          if (!hierarchyData.svpId && user.createdFromAacharyaKifId) {
            try {
              const aacharyaKif = await mongoose.model('acharyaKifDetails').findById(user.createdFromAacharyaKifId);
              if (aacharyaKif) {
                if (aacharyaKif.svpId) hierarchyData.svpId = aacharyaKif.svpId;
                if (aacharyaKif.svpName) hierarchyData.svpName = aacharyaKif.svpName;
                console.log('Found SVP details from Aacharya KIF:', {
                  svpId: hierarchyData.svpId,
                  svpName: hierarchyData.svpName
                });
              }
            } catch (error) {
              console.error("Error fetching aacharya KIF for SVP details:", error);
              // Continue without throwing error
            }
          }
        } else if (user.role === 'upSanchPramukh') {
          hierarchyData.upSanchId = user._id;
        } else if (user.role === 'sanchPramukh') {
          hierarchyData.sanchId = user._id;
        } else if (user.role === 'sankulPramukh') {
          hierarchyData.sankulId = user._id;
        } else if (user.role === 'anchalPramukh') {
          hierarchyData.anchalId = user._id;
        }
      } else {
        console.log("User not authenticated, using IDs from request body");
        
        // Use provided IDs from request body
        if (providedCreatedBy) hierarchyData.createdBy = providedCreatedBy;
        if (providedUpSanchAreaId) hierarchyData.upSanchAreaId = providedUpSanchAreaId;
        if (providedSanchAreaId) hierarchyData.sanchAreaId = providedSanchAreaId;
        if (providedSankulAreaId) hierarchyData.sankulAreaId = providedSankulAreaId;
        if (providedAnchalAreaId) hierarchyData.anchalAreaId = providedAnchalAreaId;
        if (aacharyaId) hierarchyData.aacharyaId = aacharyaId;
        if (providedSvpId) hierarchyData.svpId = providedSvpId;
        if (providedSvpName) hierarchyData.svpName = providedSvpName;
        
        // CRITICAL: Ensure createdBy is always provided when not authenticated
        if (!providedCreatedBy) {
          return res.status(400).json({
            status: 'error',
            message: 'createdBy field is required when not authenticated',
          });
        }
      }
      
      // STEP 2: If we have aacharyaId but no svpId, fetch svpId from User or acharyaKifDetails
      if (hierarchyData.aacharyaId && !hierarchyData.svpId) {
        try {
          // First try to get from User model if the aacharya exists there
          const aacharyaUser = await mongoose.model('User').findById(hierarchyData.aacharyaId);
          
          if (aacharyaUser) {
            // If aacharya user has svpId, use it
            if (aacharyaUser.svpId) {
              hierarchyData.svpId = aacharyaUser.svpId;
              if (aacharyaUser.svpName) hierarchyData.svpName = aacharyaUser.svpName;
              console.log('Found SVP details from Aacharya User:', {
                svpId: hierarchyData.svpId,
                svpName: hierarchyData.svpName
              });
            } 
            // If aacharya user has createdFromAacharyaKifId, fetch KIF and get svpId
            else if (aacharyaUser.createdFromAacharyaKifId) {
              const aacharyaKif = await mongoose.model('acharyaKifDetails').findById(
                aacharyaUser.createdFromAacharyaKifId
              );
              
              if (aacharyaKif) {
                if (aacharyaKif.svpId) hierarchyData.svpId = aacharyaKif.svpId;
                if (aacharyaKif.svpName) hierarchyData.svpName = aacharyaKif.svpName;
                console.log('Found SVP details from Aacharya KIF via User:', {
                  svpId: hierarchyData.svpId,
                  svpName: hierarchyData.svpName
                });
              }
            }
          } else {
            // If no user found, try to find KIF directly associated with this ID
            const aacharyaKif = await mongoose.model('acharyaKifDetails').findOne({
              createdBy: hierarchyData.aacharyaId
            });
            
            if (aacharyaKif) {
              if (aacharyaKif.svpId) hierarchyData.svpId = aacharyaKif.svpId;
              if (aacharyaKif.svpName) hierarchyData.svpName = aacharyaKif.svpName;
              console.log('Found SVP details directly from Aacharya KIF:', {
                svpId: hierarchyData.svpId,
                svpName: hierarchyData.svpName
              });
            }
          }
        } catch (error) {
          console.error("Error fetching aacharya SVP details:", error);
          // Continue without throwing error
        }
      }
      
      // STEP 3: If we have gsMemberPradhanId but no svpId, fetch it from GramSamiti
      if (gsMemberPradhanId && !hierarchyData.svpId) {
        try {
          const gramSamiti = await mongoose.model('GramSamiti').findOne({ 
            gsMemberPradhanId: gsMemberPradhanId 
          });
          
          if (gramSamiti && gramSamiti.svpId) {
            hierarchyData.svpId = gramSamiti.svpId;
            if (gramSamiti.svpName) hierarchyData.svpName = gramSamiti.svpName;
            console.log('Found SVP details from GramSamiti:', {
              svpId: hierarchyData.svpId,
              svpName: hierarchyData.svpName
            });
          }
        } catch (error) {
          console.error("Error fetching GramSamiti for svpId:", error);
          // Continue without throwing error
        }
      }
      
      // STEP 4: If we have some area IDs but missing others, traverse the hierarchy
      
      // If we have upSanchAreaId but missing higher levels, fetch them
      if (hierarchyData.upSanchAreaId && (!hierarchyData.sanchAreaId || !hierarchyData.sankulAreaId || !hierarchyData.anchalAreaId)) {
        try {
          const upSanchArea = await mongoose.model('UpSanchAreaNew').findById(hierarchyData.upSanchAreaId);
          
          if (upSanchArea) {
            // Get sanchAreaId from upSanchArea
            if (upSanchArea.sanchAreaId) {
              hierarchyData.sanchAreaId = upSanchArea.sanchAreaId;
              
              // Get sankulAreaId from sanchArea
              const sanchArea = await mongoose.model('SanchAreaNew').findById(upSanchArea.sanchAreaId);
              if (sanchArea && sanchArea.sankulAreaId) {
                hierarchyData.sankulAreaId = sanchArea.sankulAreaId;
                
                // Get anchalAreaId from sankulArea
                const sankulArea = await mongoose.model('SankulAreaNew').findById(sanchArea.sankulAreaId);
                if (sankulArea && sankulArea.anchalAreaId) {
                  hierarchyData.anchalAreaId = sankulArea.anchalAreaId;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error retrieving area hierarchy:", error);
          // Continue without throwing error
        }
      }
      // If we have sanchAreaId but missing higher levels, fetch them
      else if (hierarchyData.sanchAreaId && (!hierarchyData.sankulAreaId || !hierarchyData.anchalAreaId)) {
        try {
          const sanchArea = await mongoose.model('SanchAreaNew').findById(hierarchyData.sanchAreaId);
          
          if (sanchArea && sanchArea.sankulAreaId) {
            hierarchyData.sankulAreaId = sanchArea.sankulAreaId;
            
            // Get anchalAreaId from sankulArea
            const sankulArea = await mongoose.model('SankulAreaNew').findById(sanchArea.sankulAreaId);
            if (sankulArea && sankulArea.anchalAreaId) {
              hierarchyData.anchalAreaId = sankulArea.anchalAreaId;
            }
          }
        } catch (error) {
          console.error("Error retrieving area hierarchy from sanch:", error);
          // Continue without throwing error
        }
      }
      // If we have sankulAreaId but missing anchalAreaId, fetch it
      else if (hierarchyData.sankulAreaId && !hierarchyData.anchalAreaId) {
        try {
          const sankulArea = await mongoose.model('SankulAreaNew').findById(hierarchyData.sankulAreaId);
          
          if (sankulArea && sankulArea.anchalAreaId) {
            hierarchyData.anchalAreaId = sankulArea.anchalAreaId;
          }
        } catch (error) {
          console.error("Error retrieving anchal area from sankul:", error);
          // Continue without throwing error
        }
      }

      // Log the final hierarchy data for debugging
      console.log("Final hierarchy data:", hierarchyData);

      // Create new entry with available hierarchy information
      const newVidyarthiJankariPatrak = new VidyarthiJankariPatrak({
        studFirstName,
        studMiddleName,
        studLastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        genderSpecify,
        religion,
        state,
        district,
        subDistrict,
        village,
        gramPanchayat,
        studentClass,
        langOfEducation,
        fatherName,
        fatherContactNo,
        motherName,
        motherContactNo,
        occupation,
        studentPhoto,
        studentShortVieoAgreeSvpEnroll,
        parentPhoto,
        parentShortVieoAgreeSvpEnroll,
        // Add hierarchy information
        ...hierarchyData
      });

      // Save the new entry with duplicate error handling
      await newVidyarthiJankariPatrak.save();

      return successResponseWithData(
        res,
        'vidyarthi_jankari_patrak_created',
        'Student Information Form created successfully!',
        newVidyarthiJankariPatrak
      );
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message:
            'A student with the same first name, last name, and date of birth already exists.',
        });
      }

      console.error('Error creating Vidyarthi Jankari Patrak:', error);
      next(error);
    }
  }
);

export const getStudentCounts = asyncErrorHandler(async (req, res, next) => {
  try {
    const { level, id } = req.query;
    
    let query = {};
    
    // Build query based on the requested level and ID
    switch (level) {
      case 'anchal':
        query.anchalAreaId = mongoose.Types.ObjectId(id);
        break;
      case 'sankul':
        query.sankulAreaId = mongoose.Types.ObjectId(id);
        break;
      case 'sanch':
        query.sanchAreaId = mongoose.Types.ObjectId(id);
        break;
      case 'upsanch':
        query.upSanchAreaId = mongoose.Types.ObjectId(id);
        break;
      case 'acharya':
        query.aacharyaId = mongoose.Types.ObjectId(id);
        break;
      default:
        // No filtering if level is not specified
        break;
    }
    
    // Count students based on the query
    const count = await VidyarthiJankariPatrak.countDocuments(query);
    
    return res.status(200).json({
      result: true,
      message: 'student_count_retrieved',
      responseData: { count }
    });
    
  } catch (error) {
    console.error('Error getting student counts:', error);
    next(error);
  }
});

// Another useful endpoint to get all counts at once for a dashboard
export const getDashboardCounts = asyncErrorHandler(async (req, res, next) => {
  try {
    const currentUser = req.user;
    
    // Determine which counts to fetch based on user role
    let counts = {};
    
    if (currentUser.role === 'superAdmin' || currentUser.role === 'systemAdmin') {
      // Get total counts
      counts.totalStudents = await VidyarthiJankariPatrak.countDocuments();
      
      // Get counts by anchal
      const anchalCounts = await VidyarthiJankariPatrak.aggregate([
        { $group: { _id: "$anchalAreaId", count: { $sum: 1 } } },
        { $lookup: { from: "anchalareanews", localField: "_id", foreignField: "_id", as: "anchalInfo" } },
        { $project: { anchalId: "$_id", count: 1, anchalName: { $arrayElemAt: ["$anchalInfo.name", 0] } } }
      ]);
      
      counts.byAnchal = anchalCounts;
      
    } else if (currentUser.role === 'anchalPramukh') {
      // Count students in this anchal
      counts.totalInAnchal = await VidyarthiJankariPatrak.countDocuments({ 
        anchalAreaId: currentUser.anchalAreaId 
      });
      
      // Get counts by sankul within this anchal
      const sankulCounts = await VidyarthiJankariPatrak.aggregate([
        { $match: { anchalAreaId: new mongoose.Types.ObjectId(currentUser.anchalAreaId) } },
        { $group: { _id: "$sankulAreaId", count: { $sum: 1 } } },
        { $lookup: { from: "sankulareanews", localField: "_id", foreignField: "_id", as: "sankulInfo" } },
        { $project: { sankulId: "$_id", count: 1, sankulName: { $arrayElemAt: ["$sankulInfo.name", 0] } } }
      ]);
      
      counts.bySankul = sankulCounts;
      
    } else if (currentUser.role === 'sankulPramukh') {
      // Count students in this sankul
      counts.totalInSankul = await VidyarthiJankariPatrak.countDocuments({ 
        sankulAreaId: currentUser.sankulAreaId 
      });
      
      // Get counts by sanch within this sankul
      const sanchCounts = await VidyarthiJankariPatrak.aggregate([
        { $match: { sankulAreaId: new mongoose.Types.ObjectId(currentUser.sankulAreaId) } },
        { $group: { _id: "$sanchAreaId", count: { $sum: 1 } } },
        { $lookup: { from: "sanchareanews", localField: "_id", foreignField: "_id", as: "sanchInfo" } },
        { $project: { sanchId: "$_id", count: 1, sanchName: { $arrayElemAt: ["$sanchInfo.name", 0] } } }
      ]);
      
      counts.bySanch = sanchCounts;
      
    } else if (currentUser.role === 'sanchPramukh') {
      // Count students in this sanch
      counts.totalInSanch = await VidyarthiJankariPatrak.countDocuments({ 
        sanchAreaId: currentUser.sanchAreaId 
      });
      
      // Get counts by upSanch within this sanch
      const upSanchCounts = await VidyarthiJankariPatrak.aggregate([
        { $match: { sanchAreaId: new mongoose.Types.ObjectId(currentUser.sanchAreaId) } },
        { $group: { _id: "$upSanchAreaId", count: { $sum: 1 } } },
        { $lookup: { from: "upsanchareanews", localField: "_id", foreignField: "_id", as: "upSanchInfo" } },
        { $project: { upSanchId: "$_id", count: 1, upSanchName: { $arrayElemAt: ["$upSanchInfo.name", 0] } } }
      ]);
      
      counts.byUpSanch = upSanchCounts;
      
    } else if (currentUser.role === 'upSanchPramukh') {
      // Count students in this upSanch
      counts.totalInUpSanch = await VidyarthiJankariPatrak.countDocuments({ 
        upSanchAreaId: currentUser.upSanchAreaId 
      });
      
      // Get counts by acharya within this upSanch
      const aacharyaCounts = await VidyarthiJankariPatrak.aggregate([
        { $match: { upSanchAreaId: new mongoose.Types.ObjectId(currentUser.upSanchAreaId) } },
        { $group: { _id: "$aacharyaId", count: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "aacharyaInfo" } },
        { $project: { aacharyaId: "$_id", count: 1, aacharyaName: { $arrayElemAt: ["$aacharyaInfo.userName", 0] } } }
      ]);
      
      counts.byAacharya = aacharyaCounts;
      
    } else if (currentUser.role === 'aacharya') {
      // Count students registered by this acharya
      counts.totalByAacharya = await VidyarthiJankariPatrak.countDocuments({ 
        aacharyaId: currentUser._id 
      });
      
      // Get monthly registration trends
      const monthlyTrends = await VidyarthiJankariPatrak.aggregate([
        { $match: { aacharyaId: new mongoose.Types.ObjectId(currentUser._id) } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" } 
            }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { 
          $project: { 
            _id: 0, 
            year: "$_id.year", 
            month: "$_id.month", 
            count: 1 
          } 
        }
      ]);
      
      counts.monthlyTrends = monthlyTrends;
    }
    
    return res.status(200).json({
      result: true,
      message: 'dashboard_counts_retrieved',
      responseData: counts
    });
  } catch (error) {
    console.error('Error getting dashboard counts:', error);
    next(error);
  }
});

//!getone
export const getSingleVidyarthiJankariPatrak = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;

    const vidyarthiEntry = await VidyarthiJankariPatrak.findById(id);

    if (!vidyarthiEntry) {
      return ErrorResponse(
        res,
        'vidyarthi_not_found',
        'Student entry not found'
      );
    }

    return successResponseWithData(res, 'vidyarthi_retrieved', vidyarthiEntry);
  }
);


//!all
export const getAllVidyarthiJankariPatrak = asyncErrorHandler(
  async (req, res, next) => {
    const vidyarthiEntries = await VidyarthiJankariPatrak.find().sort({
      createdAt: -1,
    });

    return successResponseWithData(
      res,
      'vidyarthi_list_retrieved',
      {
        vidyarthiEntries,
        totalEntries: vidyarthiEntries.length,
      }
    );
  }
);

// Controller to get student counts by hierarchy
export const getStudentCountsByHierarchy = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      
      // Get the user with their area IDs
      const user = await User.findById(userId).select(
        'role anchalAreaId sankulAreaId sanchAreaId upSanchAreaId'
      );
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      const hierarchyData = {
        totalCount: 0,
        hierarchyBreakdown: {},
      };
      
      // Query structure will depend on user's role
      let aggregationPipeline = [];
      
      // Match stage based on user role and area permissions
      const matchStage = {};
      
      switch (user.role) {
        case 'superAdmin':
        case 'systemAdmin':
          // No filtering needed - access to all data
          break;
          
        case 'anchalPramukh':
          // Get all states in this anchal
          const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId);
          if (!anchalArea) {
            return res.status(404).json({
              status: 'error',
              message: 'Anchal area not found',
            });
          }
          matchStage.state = anchalArea.anchalName;
          break;
          
        case 'sankulPramukh':
          // Get all districts in this sankul
          const sankulArea = await SankulAreaNew.findById(user.sankulAreaId);
          if (!sankulArea) {
            return res.status(404).json({
              status: 'error',
              message: 'Sankul area not found',
            });
          }
          matchStage.district = sankulArea.sankulName;
          break;
          
        case 'sanchPramukh':
          // Get all subDistricts in this sanch
          const sanchArea = await SanchAreaNew.findById(user.sanchAreaId);
          if (!sanchArea) {
            return res.status(404).json({
              status: 'error',
              message: 'Sanch area not found',
            });
          }
          matchStage.subDistrict = sanchArea.sanchName;
          break;
          
        case 'upSanchPramukh':
          // Get all villages in this upSanch
          const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId);
          if (!upSanchArea) {
            return res.status(404).json({
              status: 'error',
              message: 'UpSanch area not found',
            });
          }
          matchStage.village = upSanchArea.upSanchName;
          break;
          
        default:
          return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to access this data',
          });
      }
      
      // Apply match filter if not superAdmin or systemAdmin
      if (Object.keys(matchStage).length > 0) {
        aggregationPipeline.push({ $match: matchStage });
      }
      
      // Build the rest of the aggregation pipeline based on user role
      switch (user.role) {
        case 'superAdmin':
        case 'systemAdmin':
          // Group by state (Anchal)
          aggregationPipeline = [
            {
              $group: {
                _id: "$state",
                count: { $sum: 1 },
                districts: {
                  $addToSet: "$district"
                }
              }
            },
            {
              $project: {
                state: "$_id",
                count: 1,
                districts: 1,
                _id: 0
              }
            },
            {
              $sort: { state: 1 }
            }
          ];
          
          const stateResults = await VidyarthiJankariPatrak.aggregate(aggregationPipeline);
          
          // Get total count
          hierarchyData.totalCount = await VidyarthiJankariPatrak.countDocuments();
          hierarchyData.hierarchyBreakdown = {
            byState: stateResults
          };
          
          // For each state, get district breakdown
          for (const state of stateResults) {
            const districtCounts = await VidyarthiJankariPatrak.aggregate([
              { $match: { state: state.state } },
              {
                $group: {
                  _id: "$district",
                  count: { $sum: 1 },
                  subDistricts: {
                    $addToSet: "$subDistrict"
                  }
                }
              },
              {
                $project: {
                  district: "$_id",
                  count: 1,
                  subDistricts: 1,
                  _id: 0
                }
              },
              {
                $sort: { district: 1 }
              }
            ]);
            
            state.districtBreakdown = districtCounts;
          }
          break;
          
        case 'anchalPramukh':
          // Group by district (Sankul)
          aggregationPipeline.push(
            {
              $group: {
                _id: "$district",
                count: { $sum: 1 },
                subDistricts: {
                  $addToSet: "$subDistrict"
                }
              }
            },
            {
              $project: {
                district: "$_id",
                count: 1,
                subDistricts: 1,
                _id: 0
              }
            },
            {
              $sort: { district: 1 }
            }
          );
          
          const districtResults = await VidyarthiJankariPatrak.aggregate(aggregationPipeline);
          
          // Get total count for this anchal
          hierarchyData.totalCount = await VidyarthiJankariPatrak.countDocuments(matchStage);
          hierarchyData.hierarchyBreakdown = {
            byDistrict: districtResults
          };
          
          // For each district, get subDistrict breakdown
          for (const district of districtResults) {
            const subDistrictCounts = await VidyarthiJankariPatrak.aggregate([
              { 
                $match: { 
                  state: matchStage.state,
                  district: district.district 
                } 
              },
              {
                $group: {
                  _id: "$subDistrict",
                  count: { $sum: 1 },
                  villages: {
                    $addToSet: "$village"
                  }
                }
              },
              {
                $project: {
                  subDistrict: "$_id",
                  count: 1,
                  villages: 1,
                  _id: 0
                }
              },
              {
                $sort: { subDistrict: 1 }
              }
            ]);
            
            district.subDistrictBreakdown = subDistrictCounts;
          }
          break;
          
        case 'sankulPramukh':
          // Group by subDistrict (Sanch)
          aggregationPipeline.push(
            {
              $group: {
                _id: "$subDistrict",
                count: { $sum: 1 },
                villages: {
                  $addToSet: "$village"
                }
              }
            },
            {
              $project: {
                subDistrict: "$_id",
                count: 1,
                villages: 1,
                _id: 0
              }
            },
            {
              $sort: { subDistrict: 1 }
            }
          );
          
          const subDistrictResults = await VidyarthiJankariPatrak.aggregate(aggregationPipeline);
          
          // Get total count for this sankul
          hierarchyData.totalCount = await VidyarthiJankariPatrak.countDocuments(matchStage);
          hierarchyData.hierarchyBreakdown = {
            bySubDistrict: subDistrictResults
          };
          
          // For each subDistrict, get village breakdown
          for (const subDistrict of subDistrictResults) {
            const villageCounts = await VidyarthiJankariPatrak.aggregate([
              { 
                $match: { 
                  district: matchStage.district,
                  subDistrict: subDistrict.subDistrict 
                } 
              },
              {
                $group: {
                  _id: "$village",
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  village: "$_id",
                  count: 1,
                  _id: 0
                }
              },
              {
                $sort: { village: 1 }
              }
            ]);
            
            subDistrict.villageBreakdown = villageCounts;
          }
          break;
          
        case 'sanchPramukh':
          // Group by village (UpSanch)
          aggregationPipeline.push(
            {
              $group: {
                _id: "$village",
                count: { $sum: 1 },
                gramPanchayats: {
                  $addToSet: "$gramPanchayat"
                }
              }
            },
            {
              $project: {
                village: "$_id",
                count: 1,
                gramPanchayats: 1,
                _id: 0
              }
            },
            {
              $sort: { village: 1 }
            }
          );
          
          const villageResults = await VidyarthiJankariPatrak.aggregate(aggregationPipeline);
          
          // Get total count for this sanch
          hierarchyData.totalCount = await VidyarthiJankariPatrak.countDocuments(matchStage);
          hierarchyData.hierarchyBreakdown = {
            byVillage: villageResults
          };
          
          // For each village, get gram panchayat breakdown if available
          for (const village of villageResults) {
            if (village.gramPanchayats && village.gramPanchayats.some(g => g)) {
              const gramPanchayatCounts = await VidyarthiJankariPatrak.aggregate([
                { 
                  $match: { 
                    subDistrict: matchStage.subDistrict,
                    village: village.village,
                    gramPanchayat: { $exists: true, $ne: null, $ne: "" }
                  } 
                },
                {
                  $group: {
                    _id: "$gramPanchayat",
                    count: { $sum: 1 }
                  }
                },
                {
                  $project: {
                    gramPanchayat: "$_id",
                    count: 1,
                    _id: 0
                  }
                },
                {
                  $sort: { gramPanchayat: 1 }
                }
              ]);
              
              village.gramPanchayatBreakdown = gramPanchayatCounts;
            }
          }
          break;
          
        case 'upSanchPramukh':
          // Group by student class and perform detailed analysis for this village
          aggregationPipeline.push(
            {
              $group: {
                _id: {
                  class: "$studentClass",
                  language: "$langOfEducation"
                },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                class: "$_id.class",
                language: "$_id.language",
                count: 1,
                _id: 0
              }
            },
            {
              $sort: { class: 1, language: 1 }
            }
          );
          
          const classResults = await VidyarthiJankariPatrak.aggregate(aggregationPipeline);
          
          // Also get religion breakdown for this village
          const religionBreakdown = await VidyarthiJankariPatrak.aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: "$religion",
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                religion: "$_id",
                count: 1,
                _id: 0
              }
            },
            {
              $sort: { religion: 1 }
            }
          ]);
          
          // Get total count for this upSanch
          hierarchyData.totalCount = await VidyarthiJankariPatrak.countDocuments(matchStage);
          hierarchyData.hierarchyBreakdown = {
            byClass: classResults,
            byReligion: religionBreakdown
          };
          break;
      }
      
      return successResponseWithData(
        res,
        'student_counts_fetched',
        'Student counts fetched successfully',
        hierarchyData
      );
      
    } catch (error) {
      console.error('Error fetching student counts by hierarchy:', error);
      next(error);
    }
  }
);


//!update
export const updateVidyarthiJankariPatrak = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if entry exists
    const existingEntry = await VidyarthiJankariPatrak.findById(id);
    if (!existingEntry) {
      return ErrorResponseWithData(
        res,
        'vidyarthi_not_found',
        'Student entry not found'
      );
    }

    // Handle file updates
    if (req.files) {
      // Function to delete old file if exists
      const deleteOldFile = (oldPath) => {
        if (oldPath && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      };

      // Update student photo
      if (req.files.studentPhoto) {
        deleteOldFile(existingEntry.studentPhoto);
        updateData.studentPhoto = req.files.studentPhoto[0].path;
      }

      // Update parent photo
      if (req.files.parentPhoto) {
        deleteOldFile(existingEntry.parentPhoto);
        updateData.parentPhoto = req.files.parentPhoto[0].path;
      }

      // Update student short video
      if (req.files.studentShortVieoAgreeSvpEnroll) {
        deleteOldFile(existingEntry.studentShortVieoAgreeSvpEnroll);
        updateData.studentShortVieoAgreeSvpEnroll =
          req.files.studentShortVieoAgreeSvpEnroll[0].path;
      }

      // Update parent short video
      if (req.files.parentShortVieoAgreeSvpEnroll) {
        deleteOldFile(existingEntry.parentShortVieoAgreeSvpEnroll);
        updateData.parentShortVieoAgreeSvpEnroll =
          req.files.parentShortVieoAgreeSvpEnroll[0].path;
      }
    }

    // Convert dateOfBirth to Date if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Update the entry
    const updatedEntry = await VidyarthiJankariPatrak.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return successResponseWithData(
      res,
      'vidyarthi_updated',
      updatedEntry
    );
  }
);

export const getFilteredStudents = asyncErrorHandler(async (req, res, next) => {
  try {
    const {
      // Area filters
      level,
      id,
      
      // Date filters
      startDate,
      endDate,
      
      // Gender filter
      gender,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Optional sorting
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build the base query
    let query = {};
    
    // Apply area filters if specified
    if (level && id) {
      switch (level.toLowerCase()) {
        case 'anchal':
          query.anchalAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'sankul':
          query.sankulAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'sanch':
          query.sanchAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'upsanch':
          query.upSanchAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'acharya':
          query.aacharyaId = mongoose.Types.ObjectId(id);
          break;
      }
    }
    
    // Apply date range filter if specified
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set endDate to end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }
    
    // Apply gender filter if specified
    if (gender) {
      query.gender = gender; // 'Male', 'Female', or 'Other'
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Prepare sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination and sorting
    const students = await VidyarthiJankariPatrak.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('upSanchAreaId', 'name')
      .populate('sanchAreaId', 'name')
      .populate('sankulAreaId', 'name')
      .populate('anchalAreaId', 'name')
      .populate('createdBy', 'name');
    
    // Get total count for pagination
    const totalCount = await VidyarthiJankariPatrak.countDocuments(query);
    
    // Calculate gender-wise counts
    const genderCounts = await VidyarthiJankariPatrak.aggregate([
      { $match: query },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    
    // Format gender counts into an object
    const genderStats = {};
    genderCounts.forEach(item => {
      genderStats[item._id] = item.count;
    });
    
    return res.status(200).json({
      result: true,
      message: 'students_retrieved_successfully',
      responseData: {
        students,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          currentPage: parseInt(page),
          perPage: parseInt(limit)
        },
        stats: {
          totalStudents: totalCount,
          genderDistribution: genderStats
        }
      }
    });
    
  } catch (error) {
    console.error('Error filtering students:', error);
    next(error);
  }
});

// API for getting student statistics with multiple filter options
export const getStudentStatistics = asyncErrorHandler(async (req, res, next) => {
  try {
    const {
      // Area filters
      level,
      id,
      
      // Date range
      startDate,
      endDate,
      
      // Optional grouping
      groupBy = 'gender' // Default grouping by gender, could be 'studentClass', 'religion', etc.
    } = req.query;
    
    // Build the base query
    let query = {};
    
    // Apply area filters if specified
    if (level && id) {
      switch (level.toLowerCase()) {
        case 'anchal':
          query.anchalAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'sankul':
          query.sankulAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'sanch':
          query.sanchAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'upsanch':
          query.upSanchAreaId = mongoose.Types.ObjectId(id);
          break;
        case 'acharya':
          query.aacharyaId = mongoose.Types.ObjectId(id);
          break;
      }
    }
    
    // Apply date range filter if specified
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }
    
    // Create the aggregation pipeline
    const pipeline = [
      { $match: query },
      { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    
    // Execute the aggregation
    const statistics = await VidyarthiJankariPatrak.aggregate(pipeline);
    
    // Get the total count
    const totalCount = await VidyarthiJankariPatrak.countDocuments(query);
    
    return res.status(200).json({
      result: true,
      message: 'student_statistics_retrieved',
      responseData: {
        totalCount,
        groupedBy: groupBy,
        statistics: statistics.map(item => ({
          [groupBy]: item._id,
          count: item.count,
          percentage: ((item.count / totalCount) * 100).toFixed(2) + '%'
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting student statistics:', error);
    next(error);
  }
});

