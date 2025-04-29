import mongoose from 'mongoose';
const { Schema } = mongoose;

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'GENERAL', 
        'VARG_INVITATION', 
        'VARG_APPROVAL_NEEDED',
        'VARG_INVITATION_APPROVED',
        'VARG_UPDATE',
        'VARG_CANCELLED',
        'URGENT_VARG_OVERLAP',
        'URGENT_VARG_PERMISSION_USED',
        'VARG_INVITATION_RESPONSE',
        'VARG_CREATOR_APPROVED',
        'HIGHER_HIERARCHY_OVERLAP',
        'HIGHER_PRIORITY_VARG_CONFLICT',
        'VARG_HIERARCHY_CONFLICT',
        'PENDING_GRAM_SAMITI'

      ],
      default: 'GENERAL'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Add indexes for querying efficiency
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);