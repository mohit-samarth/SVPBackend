import { SankulAreaNew } from '../../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { asyncErrorHandler } from '../../../middlewares/asyncErrorHandler.js';
import {
  successResponseWithData,
  ErrorBadRequestResponseWithData,
  notFoundResponse,
  successResponse,
} from '../../../helpers/apiResponse.js';
import mongoose from 'mongoose';

export const CreateSankulArea = asyncErrorHandler(async (req, res, next) => {
  const { zoneName, states, anchalName, sankulName } = req.body;

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

    if (sankulName === anchalExists.anchalName) {
      return ErrorBadRequestResponseWithData(
        res,
        'sankul_anchal_name_same',

        'Sankul name cannot be the same as Anchal name!'
      );
    }

    const existingSankuls = await SankulAreaNew.countDocuments({ anchalName });
    if (existingSankuls >= 3) {
      return ErrorBadRequestResponseWithData(
        res,
        'only_three_sankul_single_anchal_allowed',

        'Only three Sankul entries can be created for a single Anchal!'
      );
    }

    const zone = new SankulAreaNew({
      zoneName,
      states,
      anchalName,
      sankulName,
    });

    await zone.save();

    const responseData = {
      ...zone.toObject(),
      anchalName: anchalExists.anchalName || anchalName,
      anchalNameId: anchalName,
      sankulName: zone.sankulName,
      sankulNameId: zone._id,
    };

    return successResponseWithData(
      res,
      'sankul_created',

      'Sankul Area created successfully!',
      responseData
    );
  } catch (error) {
    next(error);
  }
});

export const getAllSankulArea = asyncErrorHandler(async (req, res, next) => {
  try {
    const zones = await SankulAreaNew.find()
      .populate({
        path: 'anchalName',
        select: 'anchalName',
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
      return notFoundResponse(res, 'No Sankul Area found!');
    }

    const formattedZones = zones.map((zone) => ({
      ...zone.toObject(),
      anchalName: zone.anchalName ? zone.anchalName.anchalName : null,
      anchalNameId: zone.anchalName ? zone.anchalName._id : null,
      sankulNameId: zone._id,
    }));

    return successResponseWithData(
      res,
      'Sankul Area retrieved successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const getSankulAreaById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const zones = await SankulAreaNew.findById(id)
      .populate('anchalName')
      .populate('sankulName')
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
      return notFoundResponse(res, 'No Sankul Area Found !');
    }

    const formattedZones = {
      ...zones.toObject(),
      anchalName: zones.anchalName ? zones.anchalName.anchalName : null,
      anchalNameId: zones.anchalName ? zones.anchalName._id : null,
      sankulNameId: zones._id,
    };

    return successResponseWithData(
      res,
      'Sankul Area By Id successfully!',
      formattedZones
    );
  } catch (error) {
    next(error);
  }
});

export const deleteSankulArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const area = await SankulAreaNew.findById(id);
  if (!area) {
    return notFoundResponse(res, 'Sankul Area Not Found !');
  }
  await area.deleteOne();
  return successResponse(res, 'Sankul Area Deleted !');
});

export const updateSankulArea = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const area = await SankulAreaNew.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!area) {
    return notFoundResponse(res, 'Sankul Area Not Found!');
  }

  return successResponseWithData(res, 'Sankul Area Updated!', area);
});
