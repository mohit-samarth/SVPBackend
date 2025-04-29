import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recepientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  messageType: {
    type: String,
    enum: ["text", "image","file"],
  },
  message: String,
  imageUrl: String,
  fileUrl: String, // For storing file URL
  fileName: String, // File name for download
  fileType: String, // MIME type for files
  timeStamp: {
    type: Date,
    default: Date.now,
  },
  seenBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      seenAt: { type: Date }
    }
  ],
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message', // Reference the original message
    default: null,
  },

  isForwarded: { type: Boolean, default: false }, // New field for forwarded messages
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"], // Message status values
    default: "sent", // Default to "sent" when a message is created
  },
  
});

const Message = mongoose.model('Message',messageSchema);

export default Message;
