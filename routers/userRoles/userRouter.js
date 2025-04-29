import express from 'express';

import {
  forgotPassword,
  resetPassword,
  getAllSystemAdmin,
  getAllAnchalPramukh,
  resendOtp,
  createSuperAdmin,
  getProfileSvpRoleAll,
  logoutSvpRoleAll,
  createAnchalPramukh,
  createSystemAdmin,
  loginSysAdNSvpRoleAll,
  changePasswordSysAdNSvpRoleAll,
  createSankulPramukh,
  getAllSankulPramukh,
  createSanchPramukh,
  createUpsanchPramukh,
  getAllSanchPramukh,
  getAllUpsanchPramukh,
  getTemporaryPasswordsSankulPramukh,
  getTemporaryPasswordsAnchalPramukh,
  getTemporaryPasswordsSanchPramukh,
  getTemporaryPasswordsUpanchPramukh,
  deleteProfile,
  getRoleSwitchHistory,
  toggleRole,
  getCurrentRoleStatus,
  updateAnchalPramukh,
  createAacharya,
  getTemporaryPasswordsAacharya,
  createGsMemberPradhan,
  createGsMemberSachiv,
  createGsMemberSadasya1,
  createGsMemberSadasya2,
  createGsMemberSadasya3,
  createGsMemberUppradhan,
  createGsMemberUpsachiv,
  getAllGsPradhan,
  getAllGsUppradhan,
  getAllGsSachiv,
  getAllGsUpsachiv,
  getAllGsSadasya1,
  getAllGsSadasya2,
  getAllGsSadasya3,
  getAllAacharyas,
  updateFcmToken,
  verifyFcmToken,
  getGsPradhanById,
  getAacharyaDetails,
  verifyOTP,
  getAacharyaCount,
  getAacharyaDistribution,

} from '../../controllers/userRoles/userController.js';
import { isAuthenticated,  } from '../../middlewares/auth.js';
import { otpRateLimit } from '../../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/update-fcm-token', isAuthenticated, updateFcmToken);
router.get('/verify-fcm-token', isAuthenticated, verifyFcmToken);
router.get('/aacharya/:id', isAuthenticated, getAacharyaDetails);

router.post('/post-login-svp-role-all', loginSysAdNSvpRoleAll);

router.delete('/delete-profile-user-role/:id', deleteProfile);
router.put(
  '/put-changePassword-svp-role-all',
  isAuthenticated,
  changePasswordSysAdNSvpRoleAll
);

router.get('/get-my-profile-svp-role', isAuthenticated, getProfileSvpRoleAll);


router.post('/post-forgotPassword-all-role', forgotPassword);

router.post(
  '/post-resendOtp-all-role',

  resendOtp
);
router.post(
  '/post-verifyotp-all-role',
  // otpRateLimit ,
  verifyOTP
);

router.get('/get-logout-all-role', isAuthenticated, logoutSvpRoleAll);

router.post(
  '/post-resetPassword-all-role',
  // otpRateLimit ,
  resetPassword
);

router.get(
  '/get-systemAdmin-all',

  getAllSystemAdmin
);

router.post(
  '/post-register-system-admin',

  createSystemAdmin
);

router.post('/post-register-super-admin', createSuperAdmin);

router.get(
  '/get-anchalPramukh-all',

  getAllAnchalPramukh
);

router.post(
  '/post-register-anchal-pmkh',

  createAnchalPramukh
);
router.put('/put-anchal-pmkh-id/:id', updateAnchalPramukh);
router.post(
  '/post-register-sankul-pmkh',

  createSankulPramukh
);

router.get(
  '/get-sankulPramukh-all',

  getAllSankulPramukh
);

router.post('/post-register-sanch-pmkh', createSanchPramukh);

router.get(
  '/get-sanchPramukh-all',

  getAllSanchPramukh
);

router.post(
  '/post-register-up-sanch-pmkh',

  createUpsanchPramukh
);

router.get('/get-up-sanchPramukh-all', getAllUpsanchPramukh);

router.get(
  '/get-anchal-pramukh-temporary-pass',
  getTemporaryPasswordsAnchalPramukh
);
router.get(
  '/get-aacharya-temporary-pass',
  getTemporaryPasswordsAacharya
);
router.get(
  '/get-sankul-pramukh-temporary-pass',
  getTemporaryPasswordsSankulPramukh
);
router.get(
  '/get-sanch-pramukh-temporary-pass',
  getTemporaryPasswordsSanchPramukh
);
router.get(
  '/get-upsanch-pramukh-temporary-pass',
  getTemporaryPasswordsUpanchPramukh
);

//! toggle role

router.get(
  '/role-switch-history/:userId',
  isAuthenticated,
  getRoleSwitchHistory
);
router.get(
  '/get-current-role-switch-status/:userId',
  isAuthenticated,
  getCurrentRoleStatus
);

router.patch(
  '/toggle-role-anchal-to-prashikshan-pmkh/:userId',
  isAuthenticated,
  toggleRole
);
router.patch(
  '/toggle-role-sankul-to-prashikshan-pmkh/:userId',
  isAuthenticated,
  toggleRole
);
router.patch(
  '/toggle-role-sanch-to-prashikshan-pmkh/:userId',
  isAuthenticated,
  toggleRole
);
router.patch(
  '/toggle-role-upsanch-to-prashikshan-pmkh/:userId',
  isAuthenticated,
  toggleRole
);

//!create aacharya
router.post('/post-register-aacharya', createAacharya);

//!get aacharya
router.get('/get-all-aacharya', getAllAacharyas);



//!gs post
router.post('/post-register-gram-samiti-pradhan', createGsMemberPradhan);
router.post('/post-register-gram-samiti-up-pradhan', createGsMemberUppradhan);
router.post('/post-register-gram-samiti-sachiv', createGsMemberSachiv);
router.post('/post-register-gram-samiti-up-sachiv', createGsMemberUpsachiv);
router.post('/post-register-gram-samiti-sadasya-1', createGsMemberSadasya1);
router.post('/post-register-gram-samiti-sadasya-2', createGsMemberSadasya2);
router.post('/post-register-gram-samiti-sadasya-3', createGsMemberSadasya3);

router.route('/gram-samiti-pradhan/:id').get(
  isAuthenticated,
  getGsPradhanById
);
//!gs get
router.get('/get-all-gram-samiti-pradhan', getAllGsPradhan);
router.get('/get-all-gram-samiti-up-pradhan', getAllGsUppradhan);
router.get('/get-all-gram-samiti-sachiv', getAllGsSachiv);
router.get('/get-all-gram-samiti-up-sachiv', getAllGsUpsachiv);
router.get('/get-all-gram-samiti-sadasya-1', getAllGsSadasya1);
router.get('/get-all-gram-samiti-sadasya-2', getAllGsSadasya2);
router.get('/get-all-gram-samiti-sadasya-3', getAllGsSadasya3);

router.route('/gram-samiti-pradhan/:id').get(
  isAuthenticated,
  getGsPradhanById
);

router.get(
  '/aacharya/count/count/acharya',
  isAuthenticated,
  getAacharyaCount
);

router.get(
  '/aacharya/distribution/count/acharya',
  isAuthenticated,
  getAacharyaDistribution
);

export default router;
