import { Notification } from '../../models/notification/notificationSchema.js';
import { User } from '../../models/userRoles/userSchema.js';
import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import ErrorHandler from '../../middlewares/error.js';

// Get all notifications for the current user
export const getUserNotifications = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  const notifications = await Notification.find({ 
    recipient: userId 
  })
  .sort({ createdAt: -1 })
  .limit(20);
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
});

// Get unread notification count for the current user
export const getUnreadCount = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  const count = await Notification.countDocuments({ 
    recipient: userId,
    read: false
  });
  
  res.status(200).json({
    success: true,
    count
  });
});

// Mark a notification as read
export const markAsRead = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  const notification = await Notification.findOne({
    _id: id,
    recipient: userId
  });
  
  if (!notification) {
    return next(new ErrorHandler('Notification not found', 404));
  }
  
  notification.read = true;
  await notification.save();
  
  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Send a notification (internal utility function and API endpoint)
export const sendNotification = async (recipientId, title, message, data = {}) => {
  try {
    // Create notification in the database
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      data,
      type: data.type || 'GENERAL',
      read: false
    });
    
    // Get user FCM token for push notification
    const user = await User.findById(recipientId);
    
    // If user has FCM token, send push notification
    if (user && user.fcmToken) {
      // Import FCM service
      const { sendPushNotification } = await import('../../utils/fcmService.js');
      
      // Send push notification
      await sendPushNotification(
        user.fcmToken,
        title,
        message,
        {
          ...data,
          notificationId: notification._id.toString()
        }
      );
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// API endpoint to send a notification (admin only)
export const sendNotificationEndpoint = asyncErrorHandler(async (req, res, next) => {
  const { recipientId, title, message, data } = req.body;
  const user = req.user;
  
  // Check if user is admin
  if (user.role !== 'superAdmin' && user.role !== 'systemAdmin') {
    return next(new ErrorHandler('Only admins can send notifications', 403));
  }
  
  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(new ErrorHandler('Recipient not found', 404));
  }
  
  // Send notification
  const notification = await sendNotification(recipientId, title, message, data);
  
  res.status(200).json({
    success: true,
    message: 'Notification sent successfully',
    notification
  });
});

// Delete a notification
export const deleteNotification = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  const notification = await Notification.findOne({
    _id: id,
    recipient: userId
  });
  
  if (!notification) {
    return next(new ErrorHandler('Notification not found', 404));
  }
  
  await notification.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});