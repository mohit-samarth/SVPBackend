import apiResponse from "../../helpers/apiResponse.js";

const imageRequired = (req, res, next) => {
  if (!req.file) {
    return apiResponse.ErrorResponse(res, "Media file is required");
  }
  next();
};

export default imageRequired;
