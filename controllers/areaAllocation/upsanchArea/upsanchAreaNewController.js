import { UpSanchAreaNew } from '../../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { asyncErrorHandler } from '../../../middlewares/asyncErrorHandler.js';
import {
  successResponseWithData,
  ErrorBadRequestResponseWithData,
  notFoundResponse,
  successResponse,
} from '../../../helpers/apiResponse.js';

import mongoose from 'mongoose';

export const CreateUpSanchArea = asyncErrorHandler(async (req, res, next) => {
  const { zoneName, states, anchalName, sankulName, sanchName, upSanchName } =
    req.body;

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
  if (!sankulName) {
    return ErrorBadRequestResponseWithData(
      res,
      'sankul_name_required',

      'Sankul name is required!'
    );
  }
  if (!sanchName) {
    return ErrorBadRequestResponseWithData(
      res,
      'sanch_name_required',

      'Sanch name is required!'
    );
  }
  if (!upSanchName) {
    return ErrorBadRequestResponseWithData(
      res,
      'upsanch_name_required',

      'Upsanch name is required!'
    );
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(anchalName)) {
      return ErrorBadRequestResponseWithData(
        res,

        'invalid_anchal_id',

        'Invalid Anchal ID!'
      );
    }
    const anchalExists = await mongoose
      .model('AnchalAreaNew')
      .findById(anchalName);
    if (!anchalExists) {
      return notFoundResponse(
        res,
        'anchal_not_found',

        'Anchal not found!'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(sankulName)) {
      return ErrorBadRequestResponseWithData(
        res,
        'invalid_sankul_id',

        'Invalid Sankul ID!'
      );
    }
    const sankulExists = await mongoose
      .model('SankulAreaNew')
      .findById(sankulName);
    if (!sankulExists) {
      return notFoundResponse(
        res,
        'invalid_sankul_id',

        'Sankul not found!'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(sanchName)) {
      return ErrorBadRequestResponseWithData(
        res,
        'invalid_sanch_id',

        'Invalid Sanch ID!'
      );
    }
    const sanchExists = await mongoose
      .model('SanchAreaNew')
      .findById(sanchName);
    if (!sanchExists) {
      return notFoundResponse(
        res,

        'invalid_sanch_id',

        'Sanch not found!'
      );
    }

    if (sanchName === anchalExists.anchalName) {
      return ErrorBadRequestResponseWithData(
        res,
        'sanch_anchal_name_same',

        'Sanch name cannot be the same as Anchal name!'
      );
    }
    if (sanchName === sankulExists.sankulName) {
      return ErrorBadRequestResponseWithData(
        res,
        'sanch_sankul_name_same',

        'Sanch name cannot be the same as Sankul name!'
      );
    }
    if (upSanchName === anchalExists.anchalName) {
      return ErrorBadRequestResponseWithData(
        res,
        'upsanch_anchal_name_same',

        'Upsanch name cannot be the same as Anchal name!'
      );
    }
    if (upSanchName === sankulExists.sankulName) {
      return ErrorBadRequestResponseWithData(
        res,
        'upsanch_sankul_name_same',

        'Upsanch name cannot be the same as Sankul name!'
      );
    }
    if (upSanchName === sanchExists.sanchName) {
      return ErrorBadRequestResponseWithData(
        res,
        'upsanch_sanch_name_same',

        'Upsanch name cannot be the same as Sanch name!'
      );
    }
    if (sankulExists.sankulName === anchalExists.anchalName) {
      return ErrorBadRequestResponseWithData(
        res,
        'sankul_anchal_name_same',

        'Sankul name cannot be the same as Anchal name!'
      );
    }

    const existingUpsanchCount = await UpSanchAreaNew.countDocuments({
      sanchName,
    });
    if (existingUpsanchCount >= 3) {
      return ErrorBadRequestResponseWithData(
        res,
        'only_three_upsanch_single_sanch_allowed',

        'Only three Upsanch entries can be created for a single Sanch!'
      );
    }

    const zone = new UpSanchAreaNew({
      zoneName,
      states,
      anchalName,
      sankulName,
      sanchName,
      upSanchName,
    });

    await zone.save();
    const responseData = {
      ...zone.toObject(),
      anchalName: anchalExists.anchalName,
      anchalNameId: anchalExists._id,
      sankulName: sankulExists.sankulName,
      sankulNameId: sankulExists._id,
      sanchName: sanchExists.sanchName,
      sanchNameId: sanchExists._id,
      upSanchNameId: zone._id,
    };
    return successResponseWithData(
      res,
      'upsanch_created',

      'UpSanch Area created successfully!',
      responseData
    );
  } catch (error) {
    next(error);
  }
});

export const getAllUpSanchArea = asyncErrorHandler(async (req, res, next) => {
  try {
    const zones = await UpSanchAreaNew.find()

      .populate({
        path: 'anchalName',
        select: 'anchalName',
      })
      .populate({
        path: 'sankulName',
        select: 'sankulName',
      })
      .populate({
        path: 'sanchName',
        select: 'sanchName',
      })
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
      return notFoundResponse(res, 'No UpSanch Area found!');
    }

    const formattedZones = zones.map((zone) => ({
      ...zone.toObject(),
      anchalName: zone.anchalName ? zone.anchalName.anchalName : null,
      anchalNameId: zone.anchalName ? zone.anchalName._id : null,
      sankulName: zone.sankulName ? zone.sankulName.sankulName : null,
      sankulNameId: zone.sankulName ? zone.sankulName._id : null,

      sanchName: zone.sanchName ? zone.sanchName.sanchName : null,
      sanchNameId: zone.sanchName ? zone.sanchName._id : null,

      upSanchNameId: zone._id,
    }));
    return successResponseWithData(
      res,
      'UpSanch Area retrieved successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const getUpSanchAreaById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const zones = await UpSanchAreaNew.findById(id)
      .populate('anchalName')
      .populate('sankulName')
      .populate('sanchName')
      .populate('upSanchName')

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
    if (!zones) {
      return notFoundResponse(res, 'No Sanch Area Found !');
    }

    const formattedZones = {
      ...zones.toObject(),
      anchalName: zones.anchalName ? zones.anchalName.anchalName : null,
      anchalNameId: zones.anchalName ? zones.anchalName._id : null,
      sankulName: zones.sankulName ? zones.sankulName.sankulName : null,
      sankulNameId: zones.sankulName ? zones.sankulName._id : null,

      sanchName: zones.sanchName ? zones.sanchName.sanchName : null,
      sanchNameId: zones.sanchName ? zones.sanchName._id : null,

      upSanchNameId: zones._id,
    };
    return successResponseWithData(
      res,
      'UpSanch Area By Id successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const deleteUpSanchArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const area = await UpSanchAreaNew.findById(id);
  if (!area) {
    return notFoundResponse(res, 'UpSanch Area Not Found !');
  }
  await area.deleteOne();
  return successResponse(res, 'UpSanch Area Deleted !');
});

export const updateUpsanchArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const area = await UpSanchAreaNew.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!area) {
    return notFoundResponse(res, 'Upsanch Area Not Found!');
  }

  return successResponseWithData(res, 'Upsanch Area Updated!', area);
});

//!get hierachy names
export const getHierarchicalNames = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const anchalAreas = await mongoose
        .model('AnchalAreaNew')
        .find()
        .select('_id anchalName');

      if (!anchalAreas.length) {
        return notFoundResponse(res, 'No Anchal Areas found!');
      }

      const hierarchicalData = await Promise.all(
        anchalAreas.map(async (anchal) => {
          const sankuls = await mongoose
            .model('SankulAreaNew')
            .find({ anchalName: anchal._id })
            .select('_id sankulName');

          const sankulData = await Promise.all(
            sankuls.map(async (sankul) => {
              const sanchs = await mongoose
                .model('SanchAreaNew')
                .find({ sankulName: sankul._id })
                .select('_id sanchName');

              const sanchData = await Promise.all(
                sanchs.map(async (sanch) => {
                  const upSanchs = await UpSanchAreaNew.find({
                    sanchName: sanch._id,
                  }).select('_id upSanchName');

                  return {
                    sanchId: sanch._id,
                    sanchName: sanch.sanchName,
                    upSanchs: upSanchs.map((upSanch) => ({
                      upSanchId: upSanch._id,
                      upSanchName: upSanch.upSanchName,
                    })),
                  };
                })
              );

              return {
                sankulId: sankul._id,
                sankulName: sankul.sankulName,
                sanchs: sanchData,
              };
            })
          );

          return {
            anchalId: anchal._id,
            anchalName: anchal.anchalName,
            sankuls: sankulData,
          };
        })
      );

      return successResponseWithData(
        res,
        'Hierarchical Area Allocation Names retrieved successfully!',
        hierarchicalData
      );
    } catch (error) {
      next(error);
    }
  }
);
