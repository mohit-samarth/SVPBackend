import mongoose from "mongoose";

const testAreaSchema = new mongoose.Schema({
  stateName: {
    type: String,
  },
  districtName: {
    type: String,
  },

 subDistrictName: {
    type: String,
  },
  villageName: {
    type: String,
  },
  pincode: {
    type: String,
    
  },
  createdBy: {
  
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const testArea = mongoose.model("testArea", testAreaSchema);
