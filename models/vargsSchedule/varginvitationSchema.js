import mongoose from 'mongoose';

const vargInvitationSchema = new mongoose.Schema({
  vargId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Varg',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'maybe'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    enum: [
      'Death', 
      'Casualty', 
      'Accident', 
      'Illness', 
      'Function', 
      'Marriage', 
      'Other'
    ]
  },
  customRejectionReason: {
    type: String,
    default: null
  },
  responseDate: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Creating compound indexes for efficient queries
vargInvitationSchema.index({ vargId: 1, invitedUser: 1 }, { unique: true });
vargInvitationSchema.index({ invitedUser: 1, status: 1 });

export const VargInvitation = mongoose.model('VargInvitation', vargInvitationSchema);