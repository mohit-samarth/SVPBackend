import { AnchalAreaNew } from '../../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';
import { SankulAreaNew } from '../../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { SanchAreaNew } from '../../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';
import { UpSanchAreaNew } from '../../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { asyncErrorHandler } from '../../../middlewares/asyncErrorHandler.js';
import {
  successResponseWithData,
  ErrorBadRequestResponseWithData,
  notFoundResponse,
  successResponse,
} from '../../../helpers/apiResponse.js';
import mongoose from 'mongoose';

// export const CreateAnchalArea = asyncErrorHandler(async (req, res, next) => {
//   const { zoneName, states, anchalName } = req.body;

//   if (!zoneName || !states || states.length === 0) {
//     return ErrorBadRequestResponseWithData(
//       res,
//       'zone_states_name_required',

//       'Zone name and states are required!'
//     );
//   }
//   if (!anchalName) {
//     return ErrorBadRequestResponseWithData(
//       res,
//       'anchal_name_required',
//       'Anchal name is required!'
//     );
//   }

//   try {
//     const existingAnchal = await AnchalAreaNew.findOne({ anchalName });
//     if (existingAnchal) {
//       return ErrorBadRequestResponseWithData(
//         res,
//         'anchal_name_unique',
//         'Anchal Name already Exist! Anchal name must be unique!'
//       );
//     }
//     const zone = new AnchalAreaNew({
//       zoneName,
//       states,
//       anchalName,
//     });

//     await zone.save();

//     return successResponseWithData(
//       res,
//       'anchal_created',
//       'Anchal Area created successfully!',
//       {
//         anchalAreaId: zone._id,
//         anchalName: zone.anchalName,
//         zoneName: zone.zoneName,
//         states: zone.states,
//       }
//     );
//   } catch (error) {
//     next(error);
//   }
// });




//!v1 new create
export const CreateAnchalArea = asyncErrorHandler(async (req, res, next) => {
  const { zoneName, states, anchalName } = req.body;

  // Basic validation
  if (!zoneName || !states || states.length === 0) {
    return ErrorBadRequestResponseWithData(
      res,
      'zone_states_name_required',
      'Zone name and states are required!'
    );
  }

  if (!anchalName) {
    return ErrorBadRequestResponseWithData(
      res,
      'anchal_name_required',
      'Anchal name is required!'
    );
  }

  try {
    // Check for unique anchalName where isDeleted is false
    const existingAnchal = await AnchalAreaNew.findOne({
      anchalName: anchalName,
      isDeleted: false,
    });

    if (existingAnchal) {
      return ErrorBadRequestResponseWithData(
        res,
        'anchal_name_exists',
        'An active anchal with this name already exists!'
      );
    }

    // Extract state names from the request
    const requestedStateNames = states.map((state) => state.stateName);

    // Check for duplicate state names in the request
    const uniqueStateNames = new Set(requestedStateNames);
    if (uniqueStateNames.size !== requestedStateNames.length) {
      return ErrorBadRequestResponseWithData(
        res,
        'duplicate_state_names',
        'Duplicate state names are not allowed within the same anchal!'
      );
    }

    // Modified query to explicitly check isDeleted status
    const existingStatesInOtherAnchals = await AnchalAreaNew.aggregate([
      {
        $match: {
          isDeleted: { $ne: true }, // Only look at non-deleted documents
          'states.stateName': { $in: requestedStateNames },
        },
      },
      {
        $project: {
          states: {
            $filter: {
              input: '$states',
              as: 'state',
              cond: { $in: ['$$state.stateName', requestedStateNames] },
            },
          },
        },
      },
    ]);

    if (existingStatesInOtherAnchals.length > 0) {
      const conflictingStates = existingStatesInOtherAnchals
        .map((anchal) => anchal.states.map((state) => state.stateName))
        .flat();

      if (conflictingStates.length > 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'states_already_assigned',
          `The following states are already assigned to other active anchals: ${[
            ...new Set(conflictingStates),
          ].join(', ')}`
        );
      }
    }

    // If all checks pass, create new anchal
    const zone = new AnchalAreaNew({
      zoneName,
      states,
      anchalName,
      isDeleted: false,
      deletedAt: null,
    });

    await zone.save();

    return successResponseWithData(
      res,
      'anchal_created',
      'Anchal Area created successfully!',
      {
        anchalAreaId: zone._id,
        anchalName: zone.anchalName,
        zoneName: zone.zoneName,
        states: zone.states,
      }
    );
  } catch (error) {
    next(error);
  }
});

//! recover anchal Area 
export const recoverAnchalArea = asyncErrorHandler(async (req, res, next) => {
  const { anchalId } = req.params;

  try {
    const deletedAnchal = await AnchalAreaNew.findById(anchalId);

    if (!deletedAnchal) {
      return notFoundResponse(
        res,
        'anchal_not_found',
        'Anchal Area not found!'
      );
    }

    if (!deletedAnchal.isDeleted) {
      return ErrorBadRequestResponseWithData(
        res,
        'not_deleted',
        'Anchal Area is not deleted!'
      );
    }

    // Check if there's any active (non-deleted) anchal with the same name and states
    const existingActiveAnchal = await AnchalAreaNew.findOne({
      anchalName: deletedAnchal.anchalName,
      isDeleted: false,
      'states.stateName': {
        $in: deletedAnchal.states.map((state) => state.stateName),
      },
    });

    if (existingActiveAnchal) {
      return ErrorBadRequestResponseWithData(
        res,
        'cannot_recover',
        'Cannot recover: An active Anchal Area exists with the same name and states!'
      );
    }

    // Perform recovery
    deletedAnchal.isDeleted = false;
    deletedAnchal.deletedAt = null;
    await deletedAnchal.save();

    return successResponseWithData(
      res,
      'anchal_recovered',
      'Anchal Area recovered successfully!',
      {
        anchalAreaId: deletedAnchal._id,
        anchalName: deletedAnchal.anchalName,
        zoneName: deletedAnchal.zoneName,
        states: deletedAnchal.states,
      }
    );
  } catch (error) {
    next(error);
  }
});

//!recover multiple
export const recoverMultipleAnchalAreas = asyncErrorHandler(
  async (req, res, next) => {
    const { anchalIds } = req.body;

    try {
      // Validate if anchalIds is provided and is an array
      if (!anchalIds || !Array.isArray(anchalIds) || anchalIds.length === 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'invalid_input',
          'Please provide an array of Anchal Area IDs!'
        );
      }

      // Find all requested anchals that are marked as deleted
      const deletedAnchals = await AnchalAreaNew.find({
        _id: { $in: anchalIds },
        isDeleted: true,
      });

      if (deletedAnchals.length === 0) {
        return notFoundResponse(
          res,
          'deleted_anchals_not_found',
          'No deleted Anchal Areas found with the provided IDs!'
        );
      }

      // Find any non-deleted anchals from the provided IDs
      const nonDeletedAnchalIds = await AnchalAreaNew.find({
        _id: { $in: anchalIds },
        isDeleted: false,
      }).select('_id anchalName');

      if (nonDeletedAnchalIds.length > 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'anchals_already_active',
          'Some Anchal Areas are already active!',
          {
            activeAnchalIds: nonDeletedAnchalIds.map((anchal) => ({
              id: anchal._id,
              name: anchal.anchalName,
            })),
          }
        );
      }

      // Process recovery for each deleted anchal
      const recoveryResults = [];
      const successfullyRecovered = [];
      const failedToRecover = [];

      for (const deletedAnchal of deletedAnchals) {
        // Check for existing active anchals with same name and states
        const existingActiveAnchal = await AnchalAreaNew.findOne({
          anchalName: deletedAnchal.anchalName,
          isDeleted: false,
          'states.stateName': {
            $in: deletedAnchal.states.map((state) => state.stateName),
          },
        });

        if (existingActiveAnchal) {
          failedToRecover.push({
            anchalId: deletedAnchal._id,
            anchalName: deletedAnchal.anchalName,
            reason:
              'An active Anchal Area exists with the same name and states',
            conflictingAnchalId: existingActiveAnchal._id,
          });
          continue;
        }

        try {
          // Perform recovery
          const updatedAnchal = await AnchalAreaNew.findByIdAndUpdate(
            deletedAnchal._id,
            {
              $set: {
                isDeleted: false,
                deletedAt: null,
              },
            },
            { new: true }
          );

          successfullyRecovered.push({
            anchalAreaId: updatedAnchal._id,
            anchalName: updatedAnchal.anchalName,
            zoneName: updatedAnchal.zoneName,
            states: updatedAnchal.states,
          });
        } catch (updateError) {
          failedToRecover.push({
            anchalId: deletedAnchal._id,
            anchalName: deletedAnchal.anchalName,
            reason: 'Database update failed',
            error: updateError.message,
          });
        }
      }

      // Prepare response based on recovery results
      if (successfullyRecovered.length === 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'recovery_failed',
          'Failed to recover any Anchal Areas!',
          {
            totalAttempted: deletedAnchals.length,
            failedRecoveries: failedToRecover,
          }
        );
      }

      return successResponseWithData(
        res,
        'anchals_recovered',
        `Successfully recovered ${successfullyRecovered.length} out of ${deletedAnchals.length} Anchal Areas!`,
        {
          totalAttempted: deletedAnchals.length,
          successfulRecoveries: successfullyRecovered,
          failedRecoveries: failedToRecover,
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//!soft delete
export const softDeleteAnchalArea = asyncErrorHandler(
  async (req, res, next) => {
    const { anchalId } = req.params;

    try {
      console.log('Processing delete request for anchalId:', anchalId);

      const anchalArea = await AnchalAreaNew.findById(anchalId);

      if (!anchalArea) {
        console.log('Anchal area not found for ID:', anchalId);
        return notFoundResponse(
          res,
          'anchal_not_found',
          'Anchal Area not found!'
        );
      }

      if (anchalArea.isDeleted) {
        console.log('Anchal area already deleted:', anchalId);
        return ErrorBadRequestResponseWithData(
          res,
          'already_deleted',
          'Anchal Area is already deleted!'
        );
      }

      // Check dependencies using only the anchalId
      let sankulCount = 0;
      let sanchCount = 0;
      let upSanchCount = 0;

      try {
        sankulCount = await SankulAreaNew.countDocuments({
          anchalId: anchalId,
          isDeleted: { $ne: true },
        });
        console.log('Sankul count:', sankulCount);
      } catch (err) {
        console.error('Error checking Sankul dependencies:', err);
        // Continue with other checks instead of throwing error
        console.error('Sankul check error:', err.message);
      }

      try {
        sanchCount = await SanchAreaNew.countDocuments({
          anchalId: anchalId,
          isDeleted: { $ne: true },
        });
        console.log('Sanch count:', sanchCount);
      } catch (err) {
        console.error('Error checking Sanch dependencies:', err);
        console.error('Sanch check error:', err.message);
      }

      try {
        upSanchCount = await UpSanchAreaNew.countDocuments({
          anchalId: anchalId,
          isDeleted: { $ne: true },
        });
        console.log('UpSanch count:', upSanchCount);
      } catch (err) {
        console.error('Error checking UpSanch dependencies:', err);
        console.error('UpSanch check error:', err.message);
      }

      const totalUsageCount = sankulCount + sanchCount + upSanchCount;
      console.log('Total usage count:', totalUsageCount);

      if (totalUsageCount === 0) {
        try {
          anchalArea.isDeleted = true;
          anchalArea.deletedAt = new Date();
          await anchalArea.save();

          console.log('Successfully deleted anchal area:', anchalId);
          return successResponse(
            res,
            'anchal_deleted',
            'Anchal Area soft deleted successfully!'
          );
        } catch (saveErr) {
          console.error('Error saving deleted state:', saveErr);
          return ErrorBadRequestResponseWithData(
            res,
            'save_failed',
            'Failed to update deletion status'
          );
        }
      }

      // If used, collect all usage details
      let usageDetails = [];
      if (sankulCount > 0) usageDetails.push(`${sankulCount} Sankul Area(s)`);
      if (sanchCount > 0) usageDetails.push(`${sanchCount} Sanch Area(s)`);
      if (upSanchCount > 0)
        usageDetails.push(`${upSanchCount} UpSanch Area(s)`);

      const anchalName = anchalArea.anchalName || 'Unknown';
      console.log('Anchal area in use:', usageDetails);

      return ErrorBadRequestResponseWithData(
        res,
        'anchal_in_use',
        `Cannot delete Anchal Area "${anchalName}" as it is currently used in ${usageDetails.join(
          ', '
        )}. Please remove these dependencies first.`
      );
    } catch (error) {
      console.error('Detailed error in softDeleteAnchalArea:', error);

      return ErrorBadRequestResponseWithData(
        res,
        'operation_failed',
        'Failed to process delete request. Please try again.'
      );
    }
  }
);

//! soft delete multiple
export const softDeleteMultipleAnchalAreas = asyncErrorHandler(
  async (req, res, next) => {
    const { anchalIds } = req.body;

    try {
      console.log(
        'Processing multiple delete request for anchalIds:',
        anchalIds
      );

      // Validate input
      if (!anchalIds || !Array.isArray(anchalIds) || anchalIds.length === 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'invalid_input',
          'Please provide an array of Anchal Area IDs!'
        );
      }

      // Find all requested anchals
      const anchalAreas = await AnchalAreaNew.find({
        _id: { $in: anchalIds },
      });

      if (anchalAreas.length === 0) {
        console.log('No anchal areas found for IDs:', anchalIds);
        return notFoundResponse(
          res,
          'anchals_not_found',
          'No Anchal Areas found with the provided IDs!'
        );
      }

      // Check for already deleted anchals
      const alreadyDeletedAnchals = anchalAreas.filter(
        (anchal) => anchal.isDeleted
      );
      if (alreadyDeletedAnchals.length > 0) {
        console.log(
          'Some anchals already deleted:',
          alreadyDeletedAnchals.map((a) => a._id)
        );
        return ErrorBadRequestResponseWithData(
          res,
          'already_deleted',
          'Some Anchal Areas are already deleted!',
          {
            alreadyDeletedIds: alreadyDeletedAnchals.map((anchal) => ({
              id: anchal._id,
              name: anchal.anchalName,
            })),
          }
        );
      }

      // Process each anchal
      const results = {
        successful: [],
        failed: [],
      };

      for (const anchalArea of anchalAreas) {
        try {
          // Check dependencies for current anchal
          let dependencyDetails = {
            anchalId: anchalArea._id,
            anchalName: anchalArea.anchalName,
            dependencies: [],
          };

          // Check Sankul dependencies
          const sankulCount = await SankulAreaNew.countDocuments({
            anchalId: anchalArea._id,
            isDeleted: { $ne: true },
          });
          if (sankulCount > 0) {
            dependencyDetails.dependencies.push(
              `${sankulCount} Sankul Area(s)`
            );
          }

          // Check Sanch dependencies
          const sanchCount = await SanchAreaNew.countDocuments({
            anchalId: anchalArea._id,
            isDeleted: { $ne: true },
          });
          if (sanchCount > 0) {
            dependencyDetails.dependencies.push(`${sanchCount} Sanch Area(s)`);
          }

          // Check UpSanch dependencies
          const upSanchCount = await UpSanchAreaNew.countDocuments({
            anchalId: anchalArea._id,
            isDeleted: { $ne: true },
          });
          if (upSanchCount > 0) {
            dependencyDetails.dependencies.push(
              `${upSanchCount} UpSanch Area(s)`
            );
          }

          // If no dependencies, proceed with deletion
          if (dependencyDetails.dependencies.length === 0) {
            anchalArea.isDeleted = true;
            anchalArea.deletedAt = new Date();
            await anchalArea.save();

            results.successful.push({
              id: anchalArea._id,
              name: anchalArea.anchalName,
            });
            console.log('Successfully deleted anchal area:', anchalArea._id);
          } else {
            results.failed.push({
              id: anchalArea._id,
              name: anchalArea.anchalName,
              reason: `In use by ${dependencyDetails.dependencies.join(', ')}`,
            });
            console.log('Anchal area has dependencies:', dependencyDetails);
          }
        } catch (error) {
          console.error('Error processing anchal:', anchalArea._id, error);
          results.failed.push({
            id: anchalArea._id,
            name: anchalArea.anchalName,
            reason: 'Processing error: ' + error.message,
          });
        }
      }

      // Prepare response based on results
      if (results.successful.length === 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'deletion_failed',
          'Failed to delete any Anchal Areas!',
          {
            totalAttempted: anchalAreas.length,
            failedDeletions: results.failed,
          }
        );
      }

      return successResponseWithData(
        res,
        'anchals_deleted',
        `Successfully deleted ${results.successful.length} out of ${anchalAreas.length} Anchal Areas!`,
        {
          totalAttempted: anchalAreas.length,
          successfulDeletions: results.successful,
          failedDeletions: results.failed,
        }
      );
    } catch (error) {
      console.error('Detailed error in softDeleteMultipleAnchalAreas:', error);
      return ErrorBadRequestResponseWithData(
        res,
        'operation_failed',
        'Failed to process delete request. Please try again.',
        { error: error.message }
      );
    }
  }
);

export const allocatedStatus = asyncErrorHandler(async (req, res, next) => {
  try {
    const zones = await AnchalAreaNew.find();

    const allocationData = zones.map((zone) => {
      const states = zone.states.map((state) => {
        const districts = state.districts.map((district) => {
          const subdistricts = district.subdistricts.map((subdistrict) => {
            const villages = subdistrict.villages.map((village) => ({
              villageName: village.villageName,
              isAllocated: village.isAllocated,
            }));

            return {
              subDistrictName: subdistrict.subDistrictName,
              isAllocated: subdistrict.isAllocated,
              villages,
            };
          });

          return {
            districtName: district.districtName,
            isAllocated: district.isAllocated,
            subdistricts,
          };
        });

        return {
          stateName: state.stateName,
          isAllocated: state.isAllocated,
          districts,
        };
      });

      return {
        zoneName: zone.zoneName,
        states,
      };
    });

    res.json({
      success: true,
      data: allocationData,
    });
  } catch (error) {
    next(error);
  }
});

export const getAllAnchalArea = asyncErrorHandler(async (req, res, next) => {
  try {
    const zones = await AnchalAreaNew.find()
      .populate('anchalName')
      .populate({
        path: 'states',
        populate: {
          path: 'districts',
          populate: {
            path: 'subdistricts',
            populate: {
              path: 'villages',
              select: 'villageName',
            },
          },
        },
      });

    if (!zones.length) {
      return notFoundResponse(res, 'No Anchal Area found!');
    }

    const response = zones.map((zone) => ({
      anchalAreaId: zone._id,
      anchalName: zone.anchalName,
      zoneName: zone.zoneName,
      states: zone.states,
    }));

    return successResponseWithData(
      res,
      'Anchal Area retrieved successfully!',
      response
    );
  } catch (error) {
    next(error);
  }
});

export const getAnchalAreaById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const zone = await AnchalAreaNew.findById(id)
      .populate('anchalName')
      .populate({
        path: 'states',
        populate: {
          path: 'districts',
          populate: {
            path: 'subdistricts',
            populate: {
              path: 'villages',
              select: 'villageName',
            },
          },
        },
      });

    if (!zone) {
      return notFoundResponse(res, 'No Anchal Area Found!');
    }

    const responseData = {
      ...zone.toObject(),
      anchalAreaId: zone._id,
    };

    return successResponseWithData(
      res,
      'Anchal Area By Id retrieved successfully!',
      responseData
    );
  } catch (error) {
    next(error);
  }
});

export const deleteAnchalArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const area = await AnchalAreaNew.findByIdAndDelete(id);

  if (!area) {
    return notFoundResponse(res, 'Anchal Area Not Found !');
  }

  await area.deleteOne();
  return successResponseWithData(res, 'Anchal Area Deleted !');
});

export const updateAnchalArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const area = await AnchalAreaNew.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!area) {
    return notFoundResponse(res, 'Anchal Area Not Found!');
  }

  return successResponseWithData(res, 'Anchal Area Updated!', area);
});
