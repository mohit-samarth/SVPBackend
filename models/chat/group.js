// group.js
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdBy: {
    type: String,
    enum: [
        "superAdmin",
        "systemAdmin",
        "anchalPramukh",
        "sankulPramukh",
        "sanchPramukh",
        "upSanchPramukh"
    ],
    required: true
},
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Group = mongoose.model("Group", groupSchema);

export default Group; // Use ES6 export
