// routes/meetingTravelRoutes.js
import express from 'express';
import { meetingTravelController } from '../../controllers/locationTracking/meetingTravelController.js';
import { MeetingTravel } from "../../models/locationTracking/meetingLocationSchema.js";

import { isAuthenticated, authorizeRoles } from '../../middlewares/auth.js';

const router = express.Router();


// Start new travel tracking
router.post(
  '/start',
  isAuthenticated,
  authorizeRoles('upSanchPramukh', 'sanchPramukh', 'sankulPramukh', 'anchalPramukh'),
  meetingTravelController.startTracking
);

// Update location during travel
router.post(
  '/:travelId/update',
  isAuthenticated,
  meetingTravelController.updateLocation
);

// Sync offline data
router.post(
  '/:travelId/sync-offline',
  isAuthenticated,
  meetingTravelController.syncOfflineData
);

// End travel tracking
router.post(
  '/:travelId/end',
  isAuthenticated,
  meetingTravelController.endTracking
);

// Get all travels (Super Admin only)
router.get(
  '/all',
  isAuthenticated,
  authorizeRoles('superAdmin', 'systemAdmin','sankulPramukh'),
  meetingTravelController.getAllTravels
);

// Get user's own travels
router.get(
  '/my-travels',
  isAuthenticated,
  async (req, res) => {
    try {
      const travels = await MeetingTravel.find({ userId: req.user._id })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: travels
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get specific travel details
router.get(
  '/:travelId',
  isAuthenticated,
  async (req, res) => {
    try {
      const travel = await MeetingTravel.findById(req.params.travelId)
        .populate('userId', 'userName role');

      if (!travel) {
        return res.status(404).json({
          success: false,
          message: 'Travel record not found'
        });
      }

      // Check if user is authorized to view this travel
      if (
        travel.userId.toString() !== req.user._id.toString() &&
        !['superAdmin', 'systemAdmin'].includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this travel record'
        });
      }

      res.status(200).json({
        success: true,
        data: travel
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get active travels for a user
router.get(
  '/travel/active',
  isAuthenticated,
  async (req, res) => {
    try {
      const activeTravel = await MeetingTravel.findOne({ 
        userId: req.user._id,
        status: "ongoing"
      });

      res.status(200).json({
        success: true,
        data: activeTravel,
        hasActiveTravel: !!activeTravel
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get travel statistics
router.get(
  '/stats/statistics',
  isAuthenticated,
  authorizeRoles('superAdmin','sanchPramukh', 'sankulPramukh', 'anchalPramukh'),
  async (req, res) => {
    try {
      // Overall statistics by meeting type
      const meetingStats = await MeetingTravel.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$meetingType',
            totalTravels: { $sum: 1 },
            totalDistance: { $sum: '$distanceCovered' },
            totalExpense: { $sum: '$travelExpense' },
            averageDistance: { $avg: '$distanceCovered' }
          }
        }
      ]);

      // Statistics by transport mode
      const transportStats = await MeetingTravel.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$transportMode',
            count: { $sum: 1 },
            totalDistance: { $sum: '$distanceCovered' },
            totalExpense: { $sum: '$travelExpense' }
          }
        }
      ]);

      // User statistics
      const userStats = await MeetingTravel.aggregate([
        {
          $match: {
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$userId',
            totalTravels: { $sum: 1 },
            totalDistance: { $sum: '$distanceCovered' },
            totalExpense: { $sum: '$travelExpense' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
        {
          $project: {
            userName: '$userDetails.userName',
            role: '$userDetails.role',
            totalTravels: 1,
            totalDistance: 1,
            totalExpense: 1
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          meetingStats,
          transportStats,
          userStats
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);
// Get monthly report (Super Admin only)
router.get(
  '/report/monthly-report',
  isAuthenticated,
  authorizeRoles('superAdmin'),
  async (req, res) => {
    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Year and month are required'
        });
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Detailed monthly report by user and meeting type
      const monthlyReport = await MeetingTravel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              userId: '$userId',
              meetingType: '$meetingType',
              transportMode: '$transportMode'
            },
            totalDistance: { $sum: '$distanceCovered' },
            totalExpense: { $sum: '$travelExpense' },
            travelCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id.userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
        {
          $project: {
            userName: '$userDetails.userName',
            role: '$userDetails.role',
            meetingType: '$_id.meetingType',
            transportMode: '$_id.transportMode',
            totalDistance: 1,
            totalExpense: 1,
            travelCount: 1
          }
        },
        {
          $sort: {
            userName: 1,
            meetingType: 1
          }
        }
      ]);

      // Monthly summary
      const monthlySummary = await MeetingTravel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalTravels: { $sum: 1 },
            totalDistance: { $sum: '$distanceCovered' },
            totalExpense: { $sum: '$travelExpense' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            _id: 0,
            totalTravels: 1,
            totalDistance: 1,
            totalExpense: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          details: monthlyReport,
          summary: monthlySummary[0] || {
            totalTravels: 0,
            totalDistance: 0,
            totalExpense: 0,
            uniqueUsers: 0
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;