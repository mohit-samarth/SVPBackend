import mongoose from 'mongoose';
import validator from 'validator';

const GramSamitiSchema = new mongoose.Schema(
  {
    svpId: { type: String}, 
    svpName: { type: String },
    district: { type: String, required: true },
    subDistrict: { type: String, required: true },
    village: { type: String, required: true },
    pincode: { type: String, required: true },
    gramPanchayat: { type: String, required: true },
    agreementVideo: { type: String, required: true },
    isActive: {
      type: Boolean,
      default: true
    },
    inactiveReason: {
      type: String,
      default: null
    },
    inactiveDate: {
      type: Date,
      default: null
    },
    inactivatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },

     // Add area reference fields
     upSanchAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UpSanchAreaNew'
    },
    sanchAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SanchAreaNew'
    },
    sankulAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SankulAreaNew'
    },
    anchalAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnchalAreaNew'
    },

   
    gsMemberPradhanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberUppradhanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberSachivId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberUpsachivId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberSadasya1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberSadasya2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    gsMemberSadasya3Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramSamitiInfo',
    },
    isComplete: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
  },
  { timestamps: true }
);

export const GramSamiti = mongoose.model('GramSamiti', GramSamitiSchema);
