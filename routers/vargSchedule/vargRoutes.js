import express from 'express';
import {
  createVarg,
  approveVarg,
  getAllVargs,
  getVargDetails,
  updateVarg,
  cancelVarg,
  completeVarg,
  getAvailableUsers,
  getCalendarData,
  getHigherAuthorities,
  respondToVargInvitation,
  getUserInvitedVargs,
  markVargAsUrgent

} from '../../controllers/vargsSchedule/vargController.js';
import {
  isAuthenticated,
  authorizeRoles
} from '../../middlewares/auth.js';

const router = express.Router();

// Create a new varg (for authenticated users)
router.route('/varg-create')
  .post(isAuthenticated, createVarg);

// Approve a varg (only for Super Admins)
router.route('/approve/:id')
  .put(
    isAuthenticated,
    authorizeRoles('superAdmin', 'systemAdmin'),
    approveVarg
  );

router.route('/higher-authorities')
  .get(isAuthenticated, getHigherAuthorities);


// Get all vargs with filtering
router.route('/')
  .get(isAuthenticated, getAllVargs);

// Get varg details
router.route('/:id')
  .get(isAuthenticated, getVargDetails);

// Update a varg
router.route('/update/:id')
  .put(isAuthenticated, updateVarg);

// Cancel a varg
router.route('/cancel/:id')
  .put(isAuthenticated, cancelVarg);

// Complete a varg
router.route('/complete/:id')
  .put(isAuthenticated, completeVarg);

router.route('/respond/:invitationId').put(isAuthenticated, respondToVargInvitation);
router.route('/mark-urgent/:vargId').put(isAuthenticated, markVargAsUrgent);


// Get available users for invitation
router.route('/available-users/invite')
  .get(
    isAuthenticated,
    authorizeRoles(
      'superAdmin',
      'systemAdmin',
      'anchalPramukh',
      'sankulPramukh',
      'sanchPramukh',
      'upSanchPramukh'
    ),
    getAvailableUsers
  );

  
// router.route('/invited').get(isAuthenticated, get);

// Get details of a specific varg the user is invited to
router.route('/invited/varguser').get(isAuthenticated, getUserInvitedVargs);


// Get calendar view data
router.route('/calendar/sort-calendar-data')
  .get(isAuthenticated, getCalendarData);

export default router;