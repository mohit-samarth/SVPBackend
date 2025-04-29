import express from 'express';
import { isAuthenticated } from '../../middlewares/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotificationEndpoint,
  deleteNotification
} from '../../controllers/notification/notificationController.js';

const router = express.Router();

// Get notifications for the current user
router.get('/', isAuthenticated, getUserNotifications);

// Get unread notification count for the current user
router.get('/unread-count', isAuthenticated, getUnreadCount);

// Mark a notification as read
router.put('/:id/read', isAuthenticated, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', isAuthenticated, markAllAsRead);

// Send a notification (admin only)
router.post('/send', isAuthenticated, sendNotificationEndpoint);

// Delete a notification
router.delete('/:id', isAuthenticated, deleteNotification);

export default router;