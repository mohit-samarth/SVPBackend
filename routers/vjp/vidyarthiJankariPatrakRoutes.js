import express from 'express';
import {
  createVidyarthiJankariPatrak,
  getSingleVidyarthiJankariPatrak,
  getAllVidyarthiJankariPatrak,
  getStudentCountsByHierarchy,
  getStudentCounts,
  getDashboardCounts,
  getFilteredStudents,
  getStudentStatistics,
} from '../../controllers/vjp/vidyarthiJankariPatrakController.js';
import { isAuthenticated,authorizeRoles } from '../../middlewares/auth.js';
import {

  uploadMiddleware,
} from '../../middlewares/multerHandler.js';
import {debugRequestBody } from '../../middlewares/bodyConsoleLog.js'
const router = express.Router();

router.post(
  '/post-create-vidyarthi-jankari-patrak',
  isAuthenticated,
  debugRequestBody,

  uploadMiddleware.multipleFiles,

  createVidyarthiJankariPatrak
);


router.get(
  '/get-vidyarthi-jankari-patrak-ById/:id',
  getSingleVidyarthiJankariPatrak
);
router.get('/get-vidyarthi-jankari-patrak-all', getAllVidyarthiJankariPatrak);

router.get(
  '/counts-by-hierarchy',
  isAuthenticated,
  getStudentCountsByHierarchy
);

router.get(
  '/counts',
  isAuthenticated,
  getStudentCounts
);

// Get comprehensive dashboard counts based on user role
router.get(
  '/dashboard-counts',
  isAuthenticated,
  getDashboardCounts
);

router.get('/filtered', getFilteredStudents);
router.get('/statistics',isAuthenticated, getStudentStatistics);


export default router;
