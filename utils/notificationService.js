import firebase from 'firebase-admin';
import mongoose from 'mongoose';
import { Notification } from '../models/notification/notificationSchema.js';

// Check if Firebase is already initialized
let firebaseInitialized = false;

// Initialize Firebase if not already done
const initializeFirebase = () => {
  if (!firebaseInitialized) {
    try {
      // If using environment variables for firebase config
      firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });

      firebaseInitialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      // Continue even if Firebase fails - we'll still store notifications in DB
    }
  }
};

export const sendNotification = async (userId, title, body, data = {}) => {
  try {
    initializeFirebase(); // Ensure Firebase is initialized

    console.log(`Preparing to send notification to user: ${userId}`);

    // Create notification record in the database
    const notification = await Notification.create({
      userId: mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      fcmToken: !mongoose.Types.ObjectId.isValid(userId) ? userId : null, // Direct FCM token case
      title,
      body,
      data: JSON.stringify(data),
      status: 'pending',
      type: data.type || 'GENERAL',
      message: body,
      recipient: mongoose.Types.ObjectId.isValid(userId) ? userId : null
    });

    console.log(`Notification record created with ID: ${notification._id}`);

    if (!firebaseInitialized) {
      notification.status = 'firebase_not_initialized';
      await notification.save();
      console.warn('Notification stored in DB but Firebase not initialized');
      return notification;
    }

    let targetToken = null;

    // If userId is a valid MongoDB ObjectId, fetch user's FCM token
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const { User } = await import('../models/userRoles/userSchema.js');
        const user = await User.findById(userId).select('fcmToken'); // Fetch only `fcmToken`

        if (!user) {
          console.warn(`No user found with ID: ${userId}`);
          notification.status = 'user_not_found';
          await notification.save();
          return notification;
        }

        if (!user.fcmToken) {
          console.warn(`User ${userId} found, but has no FCM token.`);
          notification.status = 'no_fcm_token';
          await notification.save();
          return notification;
        }

        targetToken = user.fcmToken;
        console.log(`Found FCM token for user ${userId}: ${targetToken.substring(0, 10)}...`);
      } catch (err) {
        console.error(`Error fetching user with ID ${userId}:`, err);
        notification.status = 'user_fetch_error';
        notification.error = err.message;
        await notification.save();
        return notification;
      }
    } else {
      targetToken = userId; // If not an ObjectId, treat as FCM token
      console.log(`Using direct FCM token: ${targetToken.substring(0, 10)}...`);
    }

    // Send Notification
    const message = {
      notification: { title, body },
      data: Object.entries({ ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' }).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value); // Convert all values to strings
          return acc;
        },
        {}
      ),
      token: targetToken
    };
    console.log(`Sending notification with title: "${title}" and type: ${data.type || 'GENERAL'}`);

    try {
      const response = await firebase.messaging().send(message);
      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.firebaseResponse = response;
      await notification.save();

      console.log(`✅ Notification sent successfully to ${userId}`);
      console.log(`   - Title: ${title}`);
      console.log(`   - Body: ${body}`);
      console.log(`   - Type: ${data.type || 'GENERAL'}`);
      console.log(`   - Firebase response: ${response}`);
      console.log(`   - Notification ID: ${notification._id}`);
      console.log(`   - Timestamp: ${notification.sentAt}`);
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      await notification.save();
      console.error('Error sending notification:', error);
    }

    return notification;
  } catch (error) {
    console.error('Error in sendNotification function:', error);
    throw error;
  }
};



export const sendBulkNotifications = async (userIds, title, body, data = {}) => {
  try {
    const results = [];

    // Send notifications to each user
    for (const userId of userIds) {
      try {
        const result = await sendNotification(userId, title, body, data);
        results.push({ userId, status: 'success', notification: result });
      } catch (error) {
        results.push({ userId, status: 'error', error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendBulkNotifications:', error);
    throw error;
  }
};


export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found or does not belong to this user');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};


export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 50, skip = 0, readStatus } = options;

    const query = { userId };

    // Filter by read status if specified
    if (readStatus === 'read') {
      query.read = true;
    } else if (readStatus === 'unread') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      unreadCount: await Notification.countDocuments({ userId, read: false })
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};