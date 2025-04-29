import express from 'express';
import { isAuthenticated } from '../../middlewares/auth.js';
import {
  createGramSamitiMembers,
  getAllGramSamiti,
  getAllGramSamitiMembersSimple,
  getGramSamitiById,
  getGramSamitiMemberByMemberId,
  getSpecificGramSamitiMember,
  generateSvpIdForGramSamiti,
  updateSvpIdStatus,
  getSvpIdDashboard,
  getSvpIdList,
  getPendingGramSamitiReport,
  getHierarchicalGramSamitiData,
  getGramSamitiMembersBySvpId,
  getSvpStatistics,
  getSvpsByUpSanchArea,
  toggleSvpActiveStatus,
  updateGramSamitiDetails,
  getSvpList,
  batchToggleSvpStatusByUpSanch,
  getGramSamitiForEditForm,
  updateSvpName

} from '../../controllers/gramSamiti/gramSamitiInfoController.js';
import { uploadMiddleware } from '../../middlewares/multerHandler.js';
import { addGramSamitiNotifications } from '../../utils/Notifications/notificationsmiddleware.js';

const router = express.Router();

router.post(
  '/post-gram-samiti-members',
  isAuthenticated,
  uploadMiddleware.multipleFiles,
  createGramSamitiMembers,
  addGramSamitiNotifications
);
router.post(
  '/post-generate-svp-id-for-gram-samiti',
  // isAuthenticated,
  generateSvpIdForGramSamiti
);

router.get(
  '/pending-report',
  isAuthenticated, 
  getPendingGramSamitiReport
);
router.get(
  '/gramsamiti-members',
  isAuthenticated, 
  getHierarchicalGramSamitiData
);

router.get('/gram-samiti/members/:svpId', getGramSamitiMembersBySvpId);
router.get(
  '/statistics/svplist/updated',
  isAuthenticated,
  getSvpList
);

router.post('/updateStatus', isAuthenticated, updateSvpIdStatus);
router.get('/dashboard', isAuthenticated, getSvpIdDashboard);
router.get('/list', isAuthenticated, getSvpIdList);
router.get('/gram-samiti/:gramSamitiId/edit-form', getGramSamitiForEditForm)


router.get('/get-all-gram-samiti', getAllGramSamiti);
router.get('/get-all-gram-samiti-new', getAllGramSamitiMembersSimple);
router.get('/get-gram-samiti/member/:id', getSpecificGramSamitiMember);
router.get('/get-gram-samiti-byId/:id', getGramSamitiById);
router.get(
  '/get-gram-samiti-member-byId/:memberId',
  getGramSamitiMemberByMemberId
);

router.post('/update-svp-name', isAuthenticated, updateSvpName);

router.post(
  '/update-gram-samiti-details',
  isAuthenticated,
  uploadMiddleware.multipleFiles,
  updateGramSamitiDetails
);


// SVP Statistics routes
router.get(
  '/statistics',
  isAuthenticated,
  getSvpStatistics
);

// Get SVPs by UpSanch area
router.get(
  '/upsanch/:upSanchAreaId/svps',
  isAuthenticated,
  getSvpsByUpSanchArea
);

// Toggle SVP active status (activate/deactivate)
router.patch(
  '/:svpId/toggle-status',
  isAuthenticated,
  toggleSvpActiveStatus
);

// Batch toggle SVP status by UpSanch
router.post(
  '/upsanch/:upSanchAreaId/batch-toggle',
  isAuthenticated,
  batchToggleSvpStatusByUpSanch
);

export default router;
