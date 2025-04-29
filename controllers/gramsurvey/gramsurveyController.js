// controllers/villageSurveyController.js
import VillageSurvey from '../../models/gramsurvey/gramsurveySchema.js';
import { UpSanchAreaNew } from '../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { SanchAreaNew } from '../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';
import { SankulAreaNew } from '../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { AnchalAreaNew } from '../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';

export const createSurvey = async (req, res) => {
  try {
    // Add the survey completion fields directly to the survey document
    const surveyData = {
      ...req.body,
      surveyCompleted: true,
      surveyCompletedAt: Date.now()
    };
    
    const survey = await VillageSurvey.create(surveyData);
    
    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      console.error(`Error creating survey: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

export const getUserAssignedAreas = async (req, res) => {
  try {
    const user = req.user;

    // Initialize areas object with a nested structure
    const assignedAreas = {
      districts: {}  // Nested structure: district -> subdistricts -> villages
    };

    if (user.role === 'sanchPramukh' && user.sanchAreaId) {
      const sanchArea = await SanchAreaNew.findById(user.sanchAreaId)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      if (sanchArea) {
        sanchArea.states.forEach(state => {
          state.districts.forEach(district => {
            const districtName = district.districtName;
            
            // Initialize district entry
            assignedAreas.districts[districtName] = {
              subdistricts: {}
            };

            district.subdistricts.forEach(subdistrict => {
              const subDistrictName = subdistrict.subDistrictName;
              
              // Initialize subdistrict entry
              assignedAreas.districts[districtName].subdistricts[subDistrictName] = {
                villages: subdistrict.villages.map(village => village.villageName)
              };
            });
          });
        });
      }
    } else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
      const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      if (upSanchArea) {
        upSanchArea.states.forEach(state => {
          state.districts.forEach(district => {
            const districtName = district.districtName;
            
            // Initialize district entry
            assignedAreas.districts[districtName] = {
              subdistricts: {}
            };

            district.subdistricts.forEach(subdistrict => {
              const subDistrictName = subdistrict.subDistrictName;
              
              // Initialize subdistrict entry
              assignedAreas.districts[districtName].subdistricts[subDistrictName] = {
                villages: subdistrict.villages.map(village => village.villageName)
              };
            });
          });
        });
      }
    }

    res.status(200).json({
      success: true,
      data: assignedAreas
    });
  } catch (error) {
    console.error(`Error getting user assigned areas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getSurveys = async (req, res) => {
  try {
    const user = req.user; // Assuming authenticated user is available
    
    // Build query with optional filters
    let query = {};
    
    // Filter by district, taluka, or village if provided
    if (req.query.district) query.district = req.query.district;
    if (req.query.taluka) query.taluka = req.query.taluka;
    if (req.query.village) query.village = req.query.village;
    
    // Add user-specific area filtering
    if (user.role === 'sanchPramukh' || user.role === 'upSanchPramukh') {
      const userAreas = await getUserAssignedAreas(req, res);
      
      // If specific filters are not provided, use user's assigned areas
      if (!query.district) query.district = { $in: userAreas.data.districts };
      if (!query.taluka) query.taluka = { $in: userAreas.data.subdistricts };
      if (!query.village) query.village = { $in: userAreas.data.villages };
    }
    
    // Handle pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const surveys = await VillageSurvey.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await VillageSurvey.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: surveys.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: surveys
    });
  } catch (error) {
    console.error(`Error getting surveys: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getSurvey = async (req, res) => {
  try {
    const survey = await VillageSurvey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid survey ID'
      });
    }
    
    console.error(`Error getting survey: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const updateSurvey = async (req, res) => {
  try {
    // Calculate total population if males or females are updated
    if (req.body.population) {
      const males = req.body.population.males || 0;
      const females = req.body.population.females || 0;
      req.body.population.total = males + females;
    }
    
    const survey = await VillageSurvey.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid survey ID'
      });
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    console.error(`Error updating survey: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const deleteSurvey = async (req, res) => {
  try {
    const survey = await VillageSurvey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }
    
    await survey.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid survey ID'
      });
    }
    
    console.error(`Error deleting survey: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getCompletedVillageSurveys = async (req, res) => {
  try {
    const completedSurveys = await VillageSurvey.find(
      { surveyCompleted: true },
      'village gramPanchayat pinCode' 
    ).sort({ village: 1 });
    
    res.status(200).json({
      success: true,
      count: completedSurveys.length,
      data: completedSurveys
    });
  } catch (error) {
    console.error(`Error fetching completed surveys: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getSurveyStats = async (req, res) => {
  try {
    // Get total count
    const totalSurveys = await VillageSurvey.countDocuments();
    
    // Get district-wise count
    // const districtStats = await VillageSurvey.aggregate([
    //   {
    //     $group: {
    //       _id: '$district',
    //       count: { $sum: 1 },
    //       totalPopulation: { $sum: '$population.total' },
    //       totalMales: { $sum: '$population.males' },
    //       totalFemales: { $sum: '$population.females' }
    //     }
    //   },
    //   { $sort: { count: -1 } }
    // ]);

    const villageStats = await VillageSurvey.aggregate([
      {
        $group: {
          _id: '$village',
          count: { $sum: 1 }, 
          totalPopulation: { $sum: '$population.total' },
          totalMales : { $sum : '$population.males'},
          totalFemales : { $sum: '$population.females'}
        }},
      { $sort: { count: -1 } }
    ]);
    
    // Get government schools count
    const govtSchoolsCount = await VillageSurvey.aggregate([
      {
        $match: { 'govtSchools.exists': true }
      },
      {
        $count: 'total'
      }
    ]);
    
    // Get private schools count
    const pvtSchoolsCount = await VillageSurvey.aggregate([
      {
        $match: { 'pvtSchools.exists': true }
      },
      {
        $count: 'total'
      }
    ]);
    
    // Get ashramshala count
    const ashramshalasCount = await VillageSurvey.aggregate([
      {
        $match: { 'ashramshala.exists': true }
      },
      {
        $count: 'total'
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalSurveys,
        // districtStats,
        villageStats,
        govtSchoolsCount: govtSchoolsCount[0]?.total || 0,
        pvtSchoolsCount: pvtSchoolsCount[0]?.total || 0,
        ashramshalasCount: ashramshalasCount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error(`Error getting survey stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getSurveyCompletionReport = async (req, res) => {
  try {
    const user = req.user;
    const { upSanchId, sanchId, sankulId, anchalId } = req.query; // Added anchalId to query parameters

    // Check if user has a valid role in the hierarchy
    const validRoles = ['upSanchPramukh', 'sanchPramukh', 'sankulPramukh', 'anchalPramukh', 'superAdmin', 'systemAdmin'];
    
    if (!validRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. This report is only available for administrative roles'
      });
    }

    // Get all villages based on user's role and area
    let assignedVillages = [];
    let areaStructure = {
      districts: {}
    };
    
    // Special logic for superAdmin and systemAdmin roles - they can see everything
    if (user.role === 'superAdmin' || user.role === 'systemAdmin') {
      // For superAdmin and systemAdmin, we'll query differently based on filters provided
      
      // If specific filtering is requested, handle it
      if (anchalId || sankulId || sanchId || upSanchId) {
        // Start with the most specific filter and work backwards
        if (upSanchId) {
          // Filter by specific UpSanch
          const upSanchArea = await UpSanchAreaNew.findById(upSanchId)
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });

          if (!upSanchArea) {
            return res.status(404).json({
              success: false,
              error: 'Specified Up-Sanch area not found'
            });
          }

          ({ assignedVillages, areaStructure } = extractVillages(upSanchArea));
        } 
        else if (sanchId) {
          // Filter by specific Sanch
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: sanchId })
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });
          
          // Combine villages from all upSanch areas
          areaStructure = { districts: {} };
          assignedVillages = [];

          for (const upSanchArea of upSanchAreas) {
            const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
            
            // Merge villages and structure
            assignedVillages = [...assignedVillages, ...upSanchVillages];
            mergeAreaStructures(areaStructure, upSanchStructure);
          }
        }
        else if (sankulId) {
          // Filter by specific Sankul
          const sanchAreas = await SanchAreaNew.find({ sankulName: sankulId });
          const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
          
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: { $in: sanchAreaIds } })
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });
          
          // Combine villages from all upSanch areas
          areaStructure = { districts: {} };
          assignedVillages = [];

          for (const upSanchArea of upSanchAreas) {
            const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
            
            // Merge villages and structure
            assignedVillages = [...assignedVillages, ...upSanchVillages];
            mergeAreaStructures(areaStructure, upSanchStructure);
          }
        }
        else if (anchalId) {
          // Filter by specific Anchal
          const sankulAreas = await SankulAreaNew.find({ anchalName: anchalId });
          const sankulAreaIds = sankulAreas.map(sankul => sankul._id);
          
          const sanchAreas = await SanchAreaNew.find({ sankulName: { $in: sankulAreaIds } });
          const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
          
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: { $in: sanchAreaIds } })
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });
          
          // Combine villages from all upSanch areas
          areaStructure = { districts: {} };
          assignedVillages = [];

          for (const upSanchArea of upSanchAreas) {
            const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
            
            // Merge villages and structure
            assignedVillages = [...assignedVillages, ...upSanchVillages];
            mergeAreaStructures(areaStructure, upSanchStructure);
          }
        }
      } 
      else {
        // No filters, load all data
        // This might be a heavy operation - consider implementing pagination or limiting data
        const upSanchAreas = await UpSanchAreaNew.find()
          .populate({
            path: 'states.districts.subdistricts.villages',
            select: 'villageName'
          });
        
        // Combine villages from all upSanch areas
        areaStructure = { districts: {} };
        assignedVillages = [];

        for (const upSanchArea of upSanchAreas) {
          const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
          
          // Merge villages and structure
          assignedVillages = [...assignedVillages, ...upSanchVillages];
          mergeAreaStructures(areaStructure, upSanchStructure);
        }
      }
    }
    // Existing logic for other roles
    else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
      // Existing logic for upSanchPramukh
      const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      if (!upSanchArea) {
        return res.status(404).json({
          success: false,
          error: 'Up-Sanch area not found'
        });
      }

      // Extract villages from upSanchArea
      ({ assignedVillages, areaStructure } = extractVillages(upSanchArea));
    } 
    else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
      const sanchArea = await SanchAreaNew.findById(user.sanchAreaId);

      if (!sanchArea) {
        return res.status(404).json({
          success: false,
          error: 'Sanch area not found'
        });
      }

      // Get upSanch areas under this sanch (filtered if upSanchId is provided)
      let upSanchQuery = { sanchName: sanchArea._id };
      
      // If specific upSanchId is provided and it's a valid MongoDB ObjectId, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Sanch'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
      const sankulArea = await SankulAreaNew.findById(user.sankulAreaId);

      if (!sankulArea) {
        return res.status(404).json({
          success: false,
          error: 'Sankul area not found'
        });
      }

      // Get sanch areas - either all under this sankul or a specific one if sanchId is provided
      let sanchQuery = { sankulName: sankulArea._id };
      
      if (sanchId) {
        sanchQuery._id = sanchId;
      }
      
      const sanchAreas = await SanchAreaNew.find(sanchQuery);
      
      if (sanchId && sanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sanch area not found or not under your Sankul'
        });
      }

      // Build query for upSanch areas
      const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
      let upSanchQuery = { sanchName: { $in: sanchAreaIds } };
      
      // If specific upSanchId is provided, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });
      
      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Sankul'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (user.role === 'anchalPramukh' && user.anchalAreaId) {
      const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId);

      if (!anchalArea) {
        return res.status(404).json({
          success: false,
          error: 'Anchal area not found'
        });
      }

      // Get all sankul areas - either all under this anchal or a specific one if sankulId is provided
      let sankulQuery = { anchalName: anchalArea._id };
      
      if (sankulId) {
        sankulQuery._id = sankulId;
      }
      
      const sankulAreas = await SankulAreaNew.find(sankulQuery);
      
      if (sankulId && sankulAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sankul area not found or not under your Anchal'
        });
      }

      // Get sanch areas - either all under these sankuls or a specific one if sanchId is provided
      const sankulAreaIds = sankulAreas.map(sankul => sankul._id);
      let sanchQuery = { sankulName: { $in: sankulAreaIds } };
      
      if (sanchId) {
        sanchQuery._id = sanchId;
      }
      
      const sanchAreas = await SanchAreaNew.find(sanchQuery);
      
      if (sanchId && sanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sanch area not found or not under your Anchal'
        });
      }

      // Build query for upSanch areas
      const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
      let upSanchQuery = { sanchName: { $in: sanchAreaIds } };
      
      // If specific upSanchId is provided, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });
      
      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Anchal'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (!(user.role === 'superAdmin' || user.role === 'systemAdmin')) {
      // This block only runs for non-admin roles that are missing their area ID
      return res.status(400).json({
        success: false,
        error: 'Missing area ID for the specified role'
      });
    }

    // Query for all surveys in the assigned villages
    const surveys = await VillageSurvey.find({
      village: { $in: assignedVillages },
      surveyCompleted: true // Only get completed surveys
    }).select('village district taluka surveyCompleted surveyCompletedAt _id surveyer');

    // Create a map to track which villages have been processed
    const processedVillages = new Map();

    // Update the structure with survey information
    surveys.forEach(survey => {
      const { district, taluka, village, surveyCompleted, surveyCompletedAt, _id, surveyer } = survey;
      
      // Skip if this village has already been processed
      if (processedVillages.has(village)) return;
      
      if (areaStructure.districts[district] && 
          areaStructure.districts[district].subdistricts[taluka] && 
          areaStructure.districts[district].subdistricts[taluka].villages[village]) {
        
        // Mark village as processed
        processedVillages.set(village, true);
        
        // Update village survey status
        areaStructure.districts[district].subdistricts[taluka].villages[village] = {
          completed: surveyCompleted,
          surveyId: _id,
          surveyer: surveyer,
          surveyCompletedAt: surveyCompletedAt
        };

        // Update completed/pending counts if survey is completed
        if (surveyCompleted) {
          areaStructure.districts[district].subdistricts[taluka].completedSurveys++;
          areaStructure.districts[district].subdistricts[taluka].pendingSurveys--;
          
          areaStructure.districts[district].completedSurveys++;
          areaStructure.districts[district].pendingSurveys--;
        }
      }
    });

    // Calculate summary statistics
    const summary = {
      totalVillages: 0,
      completedSurveys: 0,
      pendingSurveys: 0,
      completionPercentage: 0,
      role: user.role, // Include user role for reference
      filtered: !!(anchalId || upSanchId || sanchId || sankulId) // Indicate if results are filtered
    };

    Object.values(areaStructure.districts).forEach(district => {
      summary.totalVillages += district.totalVillages;
      summary.completedSurveys += district.completedSurveys;
      summary.pendingSurveys += district.pendingSurveys;
    });

    // Ensure pending surveys is never negative
    summary.pendingSurveys = Math.max(0, summary.pendingSurveys);
    
    // Ensure completed surveys never exceeds total villages
    summary.completedSurveys = Math.min(summary.completedSurveys, summary.totalVillages);
    
    // Recalculate completion percentage based on corrected values
    summary.completionPercentage = summary.totalVillages > 0 
      ? ((summary.completedSurveys / summary.totalVillages) * 100).toFixed(2) 
      : 0;

    // Fix any negative pending counts in districts and subdistricts
    Object.keys(areaStructure.districts).forEach(districtName => {
      const district = areaStructure.districts[districtName];
      district.pendingSurveys = Math.max(0, district.pendingSurveys);
      district.completedSurveys = Math.min(district.completedSurveys, district.totalVillages);
      
      Object.keys(district.subdistricts).forEach(subDistName => {
        const subdistrict = district.subdistricts[subDistName];
        subdistrict.pendingSurveys = Math.max(0, subdistrict.pendingSurveys);
        subdistrict.completedSurveys = Math.min(subdistrict.completedSurveys, subdistrict.totalVillages);
      });
    });

    // Add hierarchical information to the response with available options for filtering
    let hierarchyInfo = {
      // Current user's hierarchy position
      current: {},
      // Selected filters (if any)
      selected: {},
      // Available options for filtering
      available: {}
    };
    
    // For superAdmin and systemAdmin, provide all possible filtering options
    if (user.role === 'superAdmin' || user.role === 'systemAdmin') {
      // Add available anchal areas for filtering
      const anchalAreas = await AnchalAreaNew.find().select('anchalName _id');
      hierarchyInfo.available.anchals = anchalAreas.map(area => ({
        id: area._id,
        name: area.anchalName
      }));
      
      // If specific anchal is selected, add its details
      if (anchalId) {
        const anchalArea = await AnchalAreaNew.findById(anchalId).select('anchalName');
        hierarchyInfo.selected.anchal = anchalArea ? anchalArea.anchalName : 'Unknown';
        
        // Add available sankul areas for the selected anchal
        const sankulAreas = await SankulAreaNew.find({ anchalName: anchalId })
          .select('sankulName _id');
        hierarchyInfo.available.sankuls = sankulAreas.map(area => ({
          id: area._id,
          name: area.sankulName
        }));
      } else {
        // No specific anchal selected, show all sankuls
        const sankulAreas = await SankulAreaNew.find().select('sankulName _id anchalName');
        hierarchyInfo.available.sankuls = sankulAreas.map(area => ({
          id: area._id,
          name: area.sankulName,
          anchalId: area.anchalName
        }));
        
        // Group sankuls by their anchal
        const sankulsByAnchal = {};
        sankulAreas.forEach(area => {
          if (!sankulsByAnchal[area.anchalName]) {
            sankulsByAnchal[area.anchalName] = [];
          }
          sankulsByAnchal[area.anchalName].push({
            id: area._id,
            name: area.sankulName
          });
        });
        
        hierarchyInfo.available.sankulsByAnchal = sankulsByAnchal;
      }
      
      // If specific sankul is selected, add its details
      if (sankulId) {
        const sankulArea = await SankulAreaNew.findById(sankulId).select('sankulName anchalName');
        hierarchyInfo.selected.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
        
        // If anchal wasn't explicitly selected but we have a sankul, add the related anchal info
        if (!anchalId && sankulArea && sankulArea.anchalName) {
          const anchalArea = await AnchalAreaNew.findById(sankulArea.anchalName).select('anchalName');
          if (anchalArea) {
            hierarchyInfo.selected.anchal = anchalArea.anchalName;
          }
        }
        
        // Add available sanch areas for the selected sankul
        const sanchAreas = await SanchAreaNew.find({ sankulName: sankulId })
          .select('sanchName _id');
        hierarchyInfo.available.sanchs = sanchAreas.map(area => ({
          id: area._id,
          name: area.sanchName
        }));
        
        // If specific sanch is also selected
        if (sanchId) {
          const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
          hierarchyInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
          
          // Add available upSanchs for the selected sanch
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: sanchId })
            .select('upSanchName _id');
          hierarchyInfo.available.upSanchs = upSanchAreas.map(area => ({
            id: area._id,
            name: area.upSanchName
          }));
          
          // If specific upSanch is also selected
          if (upSanchId) {
            const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
            hierarchyInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
          }
        }
      } else if (!anchalId) {
        // No specific sankul or anchal selected, show all sanchs grouped by sankul
        // Get all sanchs
        const sanchAreas = await SanchAreaNew.find()
          .select('sanchName _id sankulName');
        
        // Group sanchs by their sankul
        const sanchsBySankul = {};
        sanchAreas.forEach(area => {
          if (!sanchsBySankul[area.sankulName]) {
            sanchsBySankul[area.sankulName] = [];
          }
          sanchsBySankul[area.sankulName].push({
            id: area._id,
            name: area.sanchName
          });
        });
        
        hierarchyInfo.available.sanchsBySankul = sanchsBySankul;
        
        // Get all upSanchs
        const upSanchAreas = await UpSanchAreaNew.find()
          .select('upSanchName _id sanchName');
        
        // Group upSanchs by their sanch
        const upSanchsBySanch = {};
        upSanchAreas.forEach(area => {
          if (!upSanchsBySanch[area.sanchName]) {
            upSanchsBySanch[area.sanchName] = [];
          }
          upSanchsBySanch[area.sanchName].push({
            id: area._id,
            name: area.upSanchName
          });
        });
        
        hierarchyInfo.available.upSanchsBySanch = upSanchsBySanch;
      }
    }
    // Existing logic for other roles
    else if (user.role === 'upSanchPramukh') {
      const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId).select('upSanchName');
      hierarchyInfo.current.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      
      // Get parent sanch info
      if (upSanchArea) {
        const sanchArea = await SanchAreaNew.findById(upSanchArea.sanchName).select('sanchName sankulName');
        if (sanchArea) {
          hierarchyInfo.current.sanch = sanchArea.sanchName;
          
          // Get parent sankul info
          const sankulArea = await SankulAreaNew.findById(sanchArea.sankulName).select('sankulName anchalName');
          if (sankulArea) {
            hierarchyInfo.current.sankul = sankulArea.sankulName;
            
            // Get parent anchal info
            const anchalArea = await AnchalAreaNew.findById(sankulArea.anchalName).select('anchalName');
            if (anchalArea) {
              hierarchyInfo.current.anchal = anchalArea.anchalName;
            }
          }
        }
      }
    } 
    else if (user.role === 'sanchPramukh') {
      const sanchArea = await SanchAreaNew.findById(user.sanchAreaId).select('sanchName sankulName');
      hierarchyInfo.current.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
      
      // Get parent sankul and anchal info
      if (sanchArea && sanchArea.sankulName) {
        const sankulArea = await SankulAreaNew.findById(sanchArea.sankulName).select('sankulName anchalName');
        if (sankulArea) {
          hierarchyInfo.current.sankul = sankulArea.sankulName;
          
          // Get parent anchal info
          if (sankulArea.anchalName) {
            const anchalArea = await AnchalAreaNew.findById(sankulArea.anchalName).select('anchalName');
            if (anchalArea) {
              hierarchyInfo.current.anchal = anchalArea.anchalName;
            }
          }
        }
      }
      
      // Add available upSanchs for filtering
      const upSanchAreas = await UpSanchAreaNew.find({ sanchName: user.sanchAreaId })
        .select('upSanchName _id');
      hierarchyInfo.available.upSanchs = upSanchAreas.map(area => ({
        id: area._id,
        name: area.upSanchName
      }));
      
      // Add selected filter info if any
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        hierarchyInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }
    else if (user.role === 'sankulPramukh') {
      const sankulArea = await SankulAreaNew.findById(user.sankulAreaId).select('sankulName anchalName');
      hierarchyInfo.current.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
      
      // Get parent anchal info
      if (sankulArea && sankulArea.anchalName) {
        const anchalArea = await AnchalAreaNew.findById(sankulArea.anchalName).select('anchalName');
        if (anchalArea) {
          hierarchyInfo.current.anchal = anchalArea.anchalName;
        }
      }
      
      // Add available sanch areas for filtering
      const sanchAreas = await SanchAreaNew.find({ sankulName: user.sankulAreaId })
        .select('sanchName _id');
      hierarchyInfo.available.sanchs = sanchAreas.map(area => ({
        id: area._id,
        name: area.sanchName
      }));
      
      // Add selected filter info if any
      if (sanchId) {
        const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
        hierarchyInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
        
        // Add available upSanchs for the selected sanch
        const upSanchAreas = await UpSanchAreaNew.find({ sanchName: sanchId })
          .select('upSanchName _id');
        hierarchyInfo.available.upSanchs = upSanchAreas.map(area => ({
          id: area._id,
          name: area.upSanchName
        }));
      } else {
        // Get all upSanchs across all sanchs in this sankul
        const allSanchIds = hierarchyInfo.available.sanchs.map(sanch => sanch.id);
        const upSanchAreas = await UpSanchAreaNew.find({ sanchName: { $in: allSanchIds } })
          .select('upSanchName _id sanchName');
        
        // Group upSanchs by their sanch
        const upSanchsBySanch = {};
        upSanchAreas.forEach(area => {
          if (!upSanchsBySanch[area.sanchName]) {
            upSanchsBySanch[area.sanchName] = [];
          }
          upSanchsBySanch[area.sanchName].push({
            id: area._id,
            name: area.upSanchName
          });
        });
        
        hierarchyInfo.available.upSanchsBySanch = upSanchsBySanch;
      }
      
      // If specific upSanchId is also provided
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        hierarchyInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }
    else if (user.role === 'anchalPramukh') {
      const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId).select('anchalName');
      hierarchyInfo.current.anchal = anchalArea ? anchalArea.anchalName : 'Unknown';
      
      // Add available sankul areas for filtering
      const sankulAreas = await SankulAreaNew.find({ anchalName: user.anchalAreaId })
        .select('sankulName _id');
      hierarchyInfo.available.sankuls = sankulAreas.map(area => ({
        id: area._id,
        name: area.sankulName
      }));
      
      // Add selected filter info if any
      if (sankulId) {
        const sankulArea = await SankulAreaNew.findById(sankulId).select('sankulName');
        hierarchyInfo.selected.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
        
        // Add available sanch areas for the selected sankul
        const sanchAreas = await SanchAreaNew.find({ sankulName: sankulId })
          .select('sanchName _id');
        hierarchyInfo.available.sanchs = sanchAreas.map(area => ({
          id: area._id,
          name: area.sanchName
        }));
      } else {
        // Get all sanchs across all sankuls in this anchal
        const allSankulIds = hierarchyInfo.available.sankuls.map(sankul => sankul.id);
        const sanchAreas = await SanchAreaNew.find({ sankulName: { $in: allSankulIds } })
          .select('sanchName _id sankulName');
        
        // Group sanchs by their sankul
        const sanchsBySankul = {};
        sanchAreas.forEach(area => {
          if (!sanchsBySankul[area.sankulName]) {
            sanchsBySankul[area.sankulName] = [];
          }
          sanchsBySankul[area.sankulName].push({
            id: area._id,
            name: area.sanchName
          });
        });
        
        hierarchyInfo.available.sanchsBySankul = sanchsBySankul;
      }
      
      // If specific sanchId is also provided
      if (sanchId) {
        const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
        hierarchyInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
        
        // Add available upSanchs for the selected sanch
        const upSanchAreas = await UpSanchAreaNew.find({ sanchName: sanchId })
          .select('upSanchName _id');
        hierarchyInfo.available.upSanchs = upSanchAreas.map(area => ({
          id: area._id,
          name: area.upSanchName
        }));
      } else if (!sankulId) {
        // Get all upSanchs across all sanchs in this anchal
        const allSankulIds = hierarchyInfo.available.sankuls.map(sankul => sankul.id);
        const sanchAreas = await SanchAreaNew.find({ sankulName: { $in: allSankulIds } })
          .select('_id');
        const sanchIds = sanchAreas.map(sanch => sanch._id);
        
        const upSanchAreas = await UpSanchAreaNew.find({ sanchName: { $in: sanchIds } })
          .select('upSanchName _id sanchName');
        
        // Group upSanchs by their sanch
        const upSanchsBySanch = {};
        upSanchAreas.forEach(area => {
          if (!upSanchsBySanch[area.sanchName]) {
            upSanchsBySanch[area.sanchName] = [];
          }
          upSanchsBySanch[area.sanchName].push({
            id: area._id,
            name: area.upSanchName
          });
        });
        
        hierarchyInfo.available.upSanchsBySanch = upSanchsBySanch;
      }
      
      // If specific upSanchId is also provided
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        hierarchyInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }

    res.status(200).json({
      success: true,
      summary,
      areaStructure,
      hierarchyInfo
    });
  } catch (error) {
    console.error(`Error generating survey completion report: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Helper function to extract villages from an upSanchArea (unchanged)
function extractVillages(upSanchArea) {
  const assignedVillages = [];
  const areaStructure = {
    districts: {}
  };

  upSanchArea.states.forEach(state => {
    state.districts.forEach(district => {
      const districtName = district.districtName;
      
      // Initialize district in structure
      areaStructure.districts[districtName] = {
        subdistricts: {},
        totalVillages: 0,
        completedSurveys: 0,
        pendingSurveys: 0
      };

      district.subdistricts.forEach(subdistrict => {
        const subDistrictName = subdistrict.subDistrictName;
        
        // Initialize subdistrict in structure
        areaStructure.districts[districtName].subdistricts[subDistrictName] = {
          totalVillages: subdistrict.villages.length,
          completedSurveys: 0,
          pendingSurveys: subdistrict.villages.length,
          villages: {}
        };

        areaStructure.districts[districtName].totalVillages += subdistrict.villages.length;
        areaStructure.districts[districtName].pendingSurveys += subdistrict.villages.length;

        // Add villages to the list and structure
        subdistrict.villages.forEach(village => {
          assignedVillages.push(village.villageName);
          areaStructure.districts[districtName].subdistricts[subDistrictName].villages[village.villageName] = {
            completed: false,
            surveyId: null,
            surveyer: null,
            surveyCompletedAt: null
          };
        });
      });
    });
  });

  return { assignedVillages, areaStructure };
}

// // Helper function to merge area structures (unchanged)
function mergeAreaStructures(targetStructure, sourceStructure) {
  // Loop through all districts in the source structure
  Object.keys(sourceStructure.districts).forEach(districtName => {
    const sourceDistrict = sourceStructure.districts[districtName];
    
    // If this district doesn't exist in target, create it
    if (!targetStructure.districts[districtName]) {
      targetStructure.districts[districtName] = {
        subdistricts: {},
        totalVillages: 0,
        completedSurveys: 0,
        pendingSurveys: 0
      };
    }
    
    // Update district totals
    targetStructure.districts[districtName].totalVillages += sourceDistrict.totalVillages;
    targetStructure.districts[districtName].completedSurveys += sourceDistrict.completedSurveys;
    targetStructure.districts[districtName].pendingSurveys += sourceDistrict.pendingSurveys;
    
    // Loop through all subdistricts in source district
    Object.keys(sourceDistrict.subdistricts).forEach(subDistrictName => {
      const sourceSubDistrict = sourceDistrict.subdistricts[subDistrictName];
      
      // If this subdistrict doesn't exist in target, create it
      if (!targetStructure.districts[districtName].subdistricts[subDistrictName]) {
        targetStructure.districts[districtName].subdistricts[subDistrictName] = {
          totalVillages: 0,
          completedSurveys: 0,
          pendingSurveys: 0,
          villages: {}
        };
      }
      
      // Update subdistrict totals
      targetStructure.districts[districtName].subdistricts[subDistrictName].totalVillages += sourceSubDistrict.totalVillages;
      targetStructure.districts[districtName].subdistricts[subDistrictName].completedSurveys += sourceSubDistrict.completedSurveys;
      targetStructure.districts[districtName].subdistricts[subDistrictName].pendingSurveys += sourceSubDistrict.pendingSurveys;
      
      // Copy all villages
      Object.keys(sourceSubDistrict.villages).forEach(villageName => {
        targetStructure.districts[districtName].subdistricts[subDistrictName].villages[villageName] = 
          sourceSubDistrict.villages[villageName];
      });
    });
  });
}


export const getCompletedVillageDetails = async (req, res) => {
  try {
    const user = req.user;
    const { upSanchId, sanchId, sankulId } = req.query; // Get hierarchy IDs from query parameters

    // Check if user has a valid role in the hierarchy
    const validRoles = ['upSanchPramukh', 'sanchPramukh', 'sankulPramukh', 'anchalPramukh', 'superAdmin', 'systemAdmin'];
    
    if (!validRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. This report is only available for administrative roles'
      });
    }

    // Get all villages based on user's role and area
    let assignedVillages = [];
    let areaStructure = {
      districts: {}
    };
    
    // Logic to get assigned villages based on user role - reused from existing controller
    // Special logic for superAdmin and systemAdmin roles - they can see everything
    if (user.role === 'superAdmin' || user.role === 'systemAdmin') {
      // For superAdmin and systemAdmin, we'll query differently based on filters provided
      
      // If specific filtering is requested, handle it
      if (sankulId || sanchId || upSanchId) {
        // Start with the most specific filter and work backwards
        if (upSanchId) {
          // Filter by specific UpSanch
          const upSanchArea = await UpSanchAreaNew.findById(upSanchId)
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });

          if (!upSanchArea) {
            return res.status(404).json({
              success: false,
              error: 'Specified Up-Sanch area not found'
            });
          }

          ({ assignedVillages, areaStructure } = extractVillages(upSanchArea));
        } 
        else if (sanchId) {
          // Filter by specific Sanch
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: sanchId })
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });
          
          // Combine villages from all upSanch areas
          areaStructure = { districts: {} };
          assignedVillages = [];

          for (const upSanchArea of upSanchAreas) {
            const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
            
            // Merge villages and structure
            assignedVillages = [...assignedVillages, ...upSanchVillages];
            mergeAreaStructures(areaStructure, upSanchStructure);
          }
        }
        else if (sankulId) {
          // Filter by specific Sankul
          const sanchAreas = await SanchAreaNew.find({ sankulName: sankulId });
          const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
          
          const upSanchAreas = await UpSanchAreaNew.find({ sanchName: { $in: sanchAreaIds } })
            .populate({
              path: 'states.districts.subdistricts.villages',
              select: 'villageName'
            });
          
          // Combine villages from all upSanch areas
          areaStructure = { districts: {} };
          assignedVillages = [];

          for (const upSanchArea of upSanchAreas) {
            const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
            
            // Merge villages and structure
            assignedVillages = [...assignedVillages, ...upSanchVillages];
            mergeAreaStructures(areaStructure, upSanchStructure);
          }
        }
      } 
      else {
        // No filters, load all data
        // This might be a heavy operation - consider implementing pagination or limiting data
        const upSanchAreas = await UpSanchAreaNew.find()
          .populate({
            path: 'states.districts.subdistricts.villages',
            select: 'villageName'
          });
        
        // Combine villages from all upSanch areas
        areaStructure = { districts: {} };
        assignedVillages = [];

        for (const upSanchArea of upSanchAreas) {
          const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
          
          // Merge villages and structure
          assignedVillages = [...assignedVillages, ...upSanchVillages];
          mergeAreaStructures(areaStructure, upSanchStructure);
        }
      }
    }
    // Rest of the role handling logic from existing controller
    else if (user.role === 'upSanchPramukh' && user.upSanchAreaId) {
      // Logic for upSanchPramukh
      const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      if (!upSanchArea) {
        return res.status(404).json({
          success: false,
          error: 'Up-Sanch area not found'
        });
      }

      // Extract villages from upSanchArea
      ({ assignedVillages, areaStructure } = extractVillages(upSanchArea));
    } 
    else if (user.role === 'sanchPramukh' && user.sanchAreaId) {
      // Rest of the code for sanchPramukh as in original controller
      const sanchArea = await SanchAreaNew.findById(user.sanchAreaId);

      if (!sanchArea) {
        return res.status(404).json({
          success: false,
          error: 'Sanch area not found'
        });
      }

      // Get upSanch areas under this sanch (filtered if upSanchId is provided)
      let upSanchQuery = { sanchName: sanchArea._id };
      
      // If specific upSanchId is provided and it's a valid MongoDB ObjectId, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });

      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Sanch'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (user.role === 'sankulPramukh' && user.sankulAreaId) {
      // Rest of the code for sankulPramukh as in original controller
      const sankulArea = await SankulAreaNew.findById(user.sankulAreaId);

      if (!sankulArea) {
        return res.status(404).json({
          success: false,
          error: 'Sankul area not found'
        });
      }

      // Get sanch areas - either all under this sankul or a specific one if sanchId is provided
      let sanchQuery = { sankulName: sankulArea._id };
      
      if (sanchId) {
        sanchQuery._id = sanchId;
      }
      
      const sanchAreas = await SanchAreaNew.find(sanchQuery);
      
      if (sanchId && sanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sanch area not found or not under your Sankul'
        });
      }

      // Build query for upSanch areas
      const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
      let upSanchQuery = { sanchName: { $in: sanchAreaIds } };
      
      // If specific upSanchId is provided, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });
      
      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Sankul'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (user.role === 'anchalPramukh' && user.anchalAreaId) {
      // Rest of the code for anchalPramukh as in original controller
      const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId);

      if (!anchalArea) {
        return res.status(404).json({
          success: false,
          error: 'Anchal area not found'
        });
      }

      // Get all sankul areas - either all under this anchal or a specific one if sankulId is provided
      let sankulQuery = { anchalName: anchalArea._id };
      
      if (sankulId) {
        sankulQuery._id = sankulId;
      }
      
      const sankulAreas = await SankulAreaNew.find(sankulQuery);
      
      if (sankulId && sankulAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sankul area not found or not under your Anchal'
        });
      }

      // Get sanch areas - either all under these sankuls or a specific one if sanchId is provided
      const sankulAreaIds = sankulAreas.map(sankul => sankul._id);
      let sanchQuery = { sankulName: { $in: sankulAreaIds } };
      
      if (sanchId) {
        sanchQuery._id = sanchId;
      }
      
      const sanchAreas = await SanchAreaNew.find(sanchQuery);
      
      if (sanchId && sanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Sanch area not found or not under your Anchal'
        });
      }

      // Build query for upSanch areas
      const sanchAreaIds = sanchAreas.map(sanch => sanch._id);
      let upSanchQuery = { sanchName: { $in: sanchAreaIds } };
      
      // If specific upSanchId is provided, add it to query
      if (upSanchId) {
        upSanchQuery._id = upSanchId;
      }
      
      const upSanchAreas = await UpSanchAreaNew.find(upSanchQuery)
        .populate({
          path: 'states.districts.subdistricts.villages',
          select: 'villageName'
        });
      
      // If filtering by a specific upSanch but none found, return an error
      if (upSanchId && upSanchAreas.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Specified Up-Sanch area not found or not under your Anchal'
        });
      }

      // Combine villages from all upSanch areas
      areaStructure = { districts: {} };
      assignedVillages = [];

      for (const upSanchArea of upSanchAreas) {
        const { assignedVillages: upSanchVillages, areaStructure: upSanchStructure } = extractVillages(upSanchArea);
        
        // Merge villages and structure
        assignedVillages = [...assignedVillages, ...upSanchVillages];
        mergeAreaStructures(areaStructure, upSanchStructure);
      }
    }
    else if (!(user.role === 'superAdmin' || user.role === 'systemAdmin')) {
      // This block only runs for non-admin roles that are missing their area ID
      return res.status(400).json({
        success: false,
        error: 'Missing area ID for the specified role'
      });
    }

    // Query for all COMPLETED surveys in the assigned villages
    const completedSurveys = await VillageSurvey.find({
      village: { $in: assignedVillages },
      surveyCompleted: true // Only get completed surveys
    }).populate('village', 'villageName pinCode state gramPanchayat')  // Populate village details
      .select('village pinCode gramPanchayat district taluka state surveyCompletedAt _id surveyer');

    // Format the response with detailed village information
    const formattedVillages = [];
    
    for (const survey of completedSurveys) {
      formattedVillages.push({
        villageName: survey.village,
        pinCode: survey.pinCode || 'N/A',
        district: survey.district || 'N/A',
        taluka: survey.taluka || 'N/A',
        state: survey.state || 'N/A',
        gramPanchayat: survey.gramPanchayat,
        completedAt: survey.surveyCompletedAt,
        surveyId: survey._id,
        surveyer: survey.surveyer || 'Unknown'
      });
    }

    // Add summary statistics
    const summary = {
      totalCompletedVillages: formattedVillages.length,
      role: user.role,
      filtered: !!(upSanchId || sanchId || sankulId)
    };

    // Add filtering information
    let filterInfo = {
      current: {},
      selected: {}
    };
    
    // For filtered views, add selected filter info
    if (user.role === 'superAdmin' || user.role === 'systemAdmin') {
      if (sankulId) {
        const sankulArea = await SankulAreaNew.findById(sankulId).select('sankulName');
        filterInfo.selected.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
      }
      
      if (sanchId) {
        const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
        filterInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
      }
      
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        filterInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    } 
    else if (user.role === 'upSanchPramukh') {
      const upSanchArea = await UpSanchAreaNew.findById(user.upSanchAreaId).select('upSanchName');
      filterInfo.current.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
    }
    else if (user.role === 'sanchPramukh') {
      const sanchArea = await SanchAreaNew.findById(user.sanchAreaId).select('sanchName');
      filterInfo.current.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
      
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        filterInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }
    else if (user.role === 'sankulPramukh') {
      const sankulArea = await SankulAreaNew.findById(user.sankulAreaId).select('sankulName');
      filterInfo.current.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
      
      if (sanchId) {
        const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
        filterInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
      }
      
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        filterInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }
    else if (user.role === 'anchalPramukh') {
      const anchalArea = await AnchalAreaNew.findById(user.anchalAreaId).select('anchalName');
      filterInfo.current.anchal = anchalArea ? anchalArea.anchalName : 'Unknown';
      
      if (sankulId) {
        const sankulArea = await SankulAreaNew.findById(sankulId).select('sankulName');
        filterInfo.selected.sankul = sankulArea ? sankulArea.sankulName : 'Unknown';
      }
      
      if (sanchId) {
        const sanchArea = await SanchAreaNew.findById(sanchId).select('sanchName');
        filterInfo.selected.sanch = sanchArea ? sanchArea.sanchName : 'Unknown';
      }
      
      if (upSanchId) {
        const upSanchArea = await UpSanchAreaNew.findById(upSanchId).select('upSanchName');
        filterInfo.selected.upSanch = upSanchArea ? upSanchArea.upSanchName : 'Unknown';
      }
    }

    res.status(200).json({
      success: true,
      summary,
      completedVillages: formattedVillages,
      filterInfo
    });
  } catch (error) {
    console.error(`Error retrieving completed village details: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};