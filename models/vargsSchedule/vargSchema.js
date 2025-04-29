import mongoose from 'mongoose';

const vargSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide varg name!'],
    enum: [
      'Sanghatan Prathmik Abhyaas Varg (SPAV)',
      'Acharya Prathmik Abhyaas Varg (APAV)',
      'Prashikshak Prashikshan Varg (PPV)',
      'Masik Abhyaas Varg (MAV)',
      'Naipunya Varg (NV)',
      'Dakshta Varg (DV)',
      'Sanghatan Dakshata Varg (SDV)',
      'Maasik Mulyankan and Samanvay Baithak (MMSB)',
      'Karyakarta Mulyankan Baithak(KMB)',
      'Vistarya Karya Varg (VKV)',
      'Kendriy Samnavay Varg (KSV)',
    ]
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date!']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date!']
  },
  location: {
    type: String,
    required: [true, 'Please provide location!']
  },
  description: {
    type: String
  },
  vargType: {
    type: String,
    enum: ['Offline', 'Online'],
    required: [true, 'Please specify varg type']
  },
  // Location for offline vargs
  location: {
    type: String,
    required: function () {
      return this.vargType === 'Offline';
    }
  },
  // Online meeting details
  platform: {
    type: String,
    enum: ['Zoom', 'Google Meet', 'Microsoft Teams'],
    required: function () {
      return this.vargType === 'Online';
    }
  },
  meetingUrl: {
    type: String,
    required: function () {
      return this.vargType === 'Online';
    }
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  urgencyReason: {
    type: String,
    default: null
  },
  overridePermissionFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  superAdminApproved: {
    type: Boolean,
    default: false
  },
  superAdminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  superAdminApprovedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorRole: {
    type: String,
    required: true,
    enum: [
      'superAdmin',
      'systemAdmin',
      'anchalPramukh',
      'sankulPramukh',
      'sanchPramukh',
      'upSanchPramukh'
    ]
  },
  // Store the relevant area IDs based on who created the varg
  anchalAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnchalAreaNew'
  },
  sankulAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SankulAreaNew'
  },
  sanchAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SanchAreaNew'
  },
  upSanchAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UpSanchAreaNew'
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  cancelReason: {
    type: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  totalInvited: {
    type: Number,
    default: 0
  },
  totalAccepted: {
    type: Number,
    default: 0
  },
  totalRejected: {
    type: Number,
    default: 0
  },
  totalMaybe: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries by date ranges
vargSchema.index({ startDate: 1, endDate: 1 });
// Index for queries by creator and status
vargSchema.index({ createdBy: 1, status: 1 });
// Index for area-based queries
vargSchema.index({ anchalAreaId: 1 });
vargSchema.index({ sankulAreaId: 1 });
vargSchema.index({ sanchAreaId: 1 });
vargSchema.index({ upSanchAreaId: 1 });

export const Varg = mongoose.model('Varg', vargSchema);