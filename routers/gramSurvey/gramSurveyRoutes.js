import express from 'express';
import {
  createSurvey,
  getSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyStats,
  getUserAssignedAreas,
  getSurveyCompletionReport,
  getCompletedVillageDetails,
  getCompletedVillageSurveys
} from '../../controllers/gramsurvey/gramsurveyController.js';

import {
  isAuthenticated
} from '../../middlewares/auth.js';

const router = express.Router();

// Stats route
router.get('/gram-survey-stats', isAuthenticated, getSurveyStats);

// Get user assigned areas
router.get('/assigned-areas', isAuthenticated, getUserAssignedAreas);

router.get('/survey-completion-report', isAuthenticated, getSurveyCompletionReport);
router.get('/surveys/completed/upsanch', getCompletedVillageSurveys);
router.get('/surveys/completed/villages', isAuthenticated,
  getCompletedVillageDetails);



// CRUD routes
// router
//   .route('/survey')
//   .get(isAuthenticated, getSurveys)
//   .post(isAuthenticated, createSurvey);
router
  .route('/survey')
  .get(isAuthenticated, getSurveys)
  .post( createSurvey);

router
  .route('/:id')
  .get(isAuthenticated, getSurvey)
  .put(isAuthenticated, updateSurvey)
  .delete(isAuthenticated, deleteSurvey);

export default router;