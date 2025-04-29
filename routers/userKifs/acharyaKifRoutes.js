import express from 'express';
import multer from 'multer';
import { createForm, 
  getAllForms, 
  getFormById, 
  updateForm, 
  deleteForm,
  getFormsByUpSanch,
  getUpSanchForms,
  updateAssessmentStatus,
  getFormDetails,
  getSelectedAcharyas,
  getSvpIdsByUpSanch,
  getAcharyasByStatus,
  getUsernamesBySvpId
  // markInterviewCompleted, 
  // markExamCompleted, 
  // updateSelectionStatus,
 } from '../../controllers/userKifs/acharyaKifController.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes
router.post('/acharya-kif-post',isAuthenticated, createForm);

router.get('/achaya-all-kif', getAllForms);
router.get('/acharya-kif-by-upsanch', isAuthenticated, getFormsByUpSanch);

router.get('/:id', getFormById);


router.put('/update-acharya-kif/:id', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificationFile', maxCount: 1 },
  { name: 'licenseFile', maxCount: 1 },
  { name: 'numberplatephoto', maxCount: 10 },
]), updateForm);

router.delete('/:id', deleteForm);

// Get UpSanch forms
router.get('/api/acharya/forms/upsanch', isAuthenticated, getUpSanchForms);
router.get('/api/acharya/forms/upsanch/svpid', isAuthenticated, getSvpIdsByUpSanch);
  
// Update assessment status
router.patch('/api/acharya/form/:formId/assessment', isAuthenticated, updateAssessmentStatus);

// Get form details
router.get('/api/acharya/form/:formId', isAuthenticated, getFormDetails);
router.get('/api/acharya/forms/selected', isAuthenticated, getSelectedAcharyas);
router.get('/usernames/:svpId', getUsernamesBySvpId);
router.get('/status/get/acharya',isAuthenticated, getAcharyasByStatus);

// router.patch(
//   '/forms/:formId/interview',
//   isAuthenticated,
//   markInterviewCompleted
// );

// // Route to mark exam as completed
// router.patch(
//   '/forms/:formId/exam',
//   isAuthenticated,
//   markExamCompleted
// );

// // Route to update final selection status
// router.patch(
//   '/forms/:formId/selection',
//   isAuthenticated,
//   updateSelectionStatus
// );

export default router;
