import { SanchAreaNew } from '../../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';
import { asyncErrorHandler } from '../../../middlewares/asyncErrorHandler.js';
import {
  successResponseWithData,
  ErrorBadRequestResponseWithData,
  notFoundResponse,
  successResponse,
} from '../../../helpers/apiResponse.js';
import mongoose from 'mongoose';

export const CreateSanchArea = asyncErrorHandler(async (req, res, next) => {
  const { zoneName, states, anchalName, sankulName, sanchName } = req.body;

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
    if (sankulExists.sankulName === anchalExists.anchalName) {
      return ErrorBadRequestResponseWithData(
        res,
        'sankul_anchal_name_same',

        'Sankul name cannot be the same as Anchal name!'
      );
    }

    const existingSanchCount = await SanchAreaNew.countDocuments({
      sankulName,
    });
    if (existingSanchCount >= 3) {
      return ErrorBadRequestResponseWithData(
        res,
        'only_three_sanch_single_sankul_allowed',

        'Only three Sanch entries can be created for a single Sankul!'
      );
    }

    const zone = new SanchAreaNew({
      zoneName,
      states,
      anchalName,
      sankulName,
      sanchName,
    });

    await zone.save();

    const responseData = {
      ...zone.toObject(),
      anchalName: anchalExists.anchalName,
      anchalNameId: anchalExists._id,
      sankulName: sankulExists.sankulName,
      sankulNameId: sankulExists._id,
      sanchNameId: zone._id,
    };

    return successResponseWithData(
      res,
      'sanch_created',

      'Sanch Area created successfully!',
      responseData
    );
  } catch (error) {
    next(error);
  }
});

export const getAllSanchArea = asyncErrorHandler(async (req, res, next) => {
  try {
    const zones = await SanchAreaNew.find()

      .populate({
        path: 'anchalName',
        select: 'anchalName',
      })
      .populate({
        path: 'sankulName',
        select: 'sankulName',
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
      return notFoundResponse(res, 'No Sanch Area found!');
    }

    const formattedZones = zones.map((zone) => ({
      ...zone.toObject(),
      anchalName: zone.anchalName ? zone.anchalName.anchalName : null,
      anchalNameId: zone.anchalName ? zone.anchalName._id : null,
      sankulName: zone.sankulName ? zone.sankulName.sankulName : null,
      sankulNameId: zone.sankulName ? zone.sankulName._id : null,
      sanchNameId: zone._id,
    }));
    return successResponseWithData(
      res,
      'Sanch Area retrieved successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const getSanchAreaById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const zones = await SanchAreaNew.findById(id)
      .populate('anchalName')
      .populate('sankulName')
      .populate('sanchName')

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

      sachNameId: zones._id,
    };

    return successResponseWithData(
      res,
      'Sanch Area By Id successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const deleteSanchArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const area = await SanchAreaNew.findById(id);
  if (!area) {
    return notFoundResponse(res, 'Sanch Area Not Found !');
  }
  await area.deleteOne();
  return successResponse(res, 'Sanch Area Deleted !');
});

export const updateSanchArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const area = await SanchAreaNew.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!area) {
    return notFoundResponse(res, 'Sanch Area Not Found!');
  }

  return successResponseWithData(res, 'Sanch Area Updated!', area);
});
