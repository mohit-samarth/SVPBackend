import { Anchal } from "../../models/userArea/anchalSchema.js";
import {
  successResponseWithData,
  notFoundResponse,
  ErrorBadRequestResponseWithData,
} from "../../helpers/apiResponse.js";
import { asyncErrorHandler } from "../../middlewares/asyncErrorHandler.js";


export const createAnchal = asyncErrorHandler(async (req, res) => {
  const { name, zone, state, district, taluka, villages } = req.body;

  if (!name || !zone || !state || !district || !taluka || !villages) {
    return ErrorBadRequestResponseWithData(
      res,
      "Missing required fields!",
      req.body
    );
  }

  const newAnchal = new Anchal({
    name,
    zone,
    state,
    district,
    taluka,
    villages,
  });
  await newAnchal.save();

  return successResponseWithData(
    res,
    "Anchal created successfully!",
    newAnchal
  );
});

// Get all Anchals
export const getAnchals = asyncErrorHandler(async (req, res) => {
  const anchals = await Anchal.find();

  if (!anchals.length) {
    return notFoundResponse(res, "No Anchals found!");
  }

  return successResponseWithData(res, "Anchals fetched successfully!", anchals);
});

// Get a single Anchal by ID
export const getAnchalById = asyncErrorHandler(async (req, res) => {
  const anchal = await Anchal.findById(req.params.id);

  if (!anchal) {
    return notFoundResponse(res, "Anchal not found!");
  }

  return successResponseWithData(res, "Anchal fetched successfully!", {
    name: anchal.name,
    district: anchal.district,
    taluka: anchal.taluka,
    villages: anchal.villages,
  });
});

// Update an Anchal by ID
export const updateAnchal = asyncErrorHandler(async (req, res) => {
  const { name, zone, state, district, taluka, villages } = req.body;

  const updatedAnchal = await Anchal.findByIdAndUpdate(
    req.params.id,
    { name, zone, state, district, taluka, villages },
    { new: true, runValidators: true }
  );

  if (!updatedAnchal) {
    return notFoundResponse(res, "Anchal not found!");
  }

  return successResponseWithData(
    res,
    "Anchal updated successfully!",
    updatedAnchal
  );
});

// Delete an Anchal by ID
export const deleteAnchal = asyncErrorHandler(async (req, res) => {
  const deletedAnchal = await Anchal.findByIdAndDelete(req.params.id);

  if (!deletedAnchal) {
    return notFoundResponse(res, "Anchal not found!");
  }

  return successResponseWithData(res, "Anchal deleted successfully!");
});
