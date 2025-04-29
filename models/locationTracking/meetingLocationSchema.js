import mongoose from "mongoose";

const locationPointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  placeName: {
    type: String,
    default: 'Unknown Location'
  },
  city: {
    type: String,
    default: 'Unknown City'
  },
  state: {
    type: String,
    default: 'Unknown State'
  },
  country: {
    type: String,
    default: 'Unknown Country'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const meetingTravelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  meetingType: {
    type: String,
    enum: ["MAV", "APAV", "Naipunya_Varg", "Dakshta_Varg", "Gram_Survey"],
    required: true
  },
  isGramSurvey: {
    type: Boolean,
    default: false
  },
  startLocation: locationPointSchema,
  endLocation: locationPointSchema,
  travelPath: [locationPointSchema],  // Array of coordinates for polyline
  transportMode: {
    type: String,
    enum: ["bus", "car", "bike", "train", "walking"],
    required: true
  },
  distanceCovered: {
    type: Number,  // in kilometers
    default: 0
  },
  travelExpense: {
    type: Number,  // calculated based on distance (₹5 per km)
    default: 0
  },
  status: {
    type: String,
    enum: ["ongoing", "completed", "paused"],
    default: "ongoing"
  },
  offlineLocations: [locationPointSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
meetingTravelSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  
  // Calculate expense based on distance
  this.travelExpense = this.distanceCovered * 5; // ₹5 per km
  
  next();
});

export const MeetingTravel = mongoose.model("MeetingTravel", meetingTravelSchema);