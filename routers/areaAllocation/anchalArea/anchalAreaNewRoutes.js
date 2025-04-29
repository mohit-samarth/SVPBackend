import express from 'express';
import {
  CreateAnchalArea,
  deleteAnchalArea,
  getAllAnchalArea,
  getAnchalAreaById,
  updateAnchalArea,
  allocatedStatus,
  recoverAnchalArea,
  softDeleteAnchalArea,
  softDeleteMultipleAnchalAreas,
  recoverMultipleAnchalAreas,
  
} from '../../../controllers/areaAllocation/anchalArea/anchalAreaNewController.js';

import { isAuthenticated } from '../../../middlewares/auth.js';

const router = express.Router();


router.post(
  '/post-anchal-area-allocation',
  isAuthenticated,

  CreateAnchalArea
);
router.get('/get-anchal-area-allocation', getAllAnchalArea);
router.get('/get-anchal-area-allocation-id/:id', getAnchalAreaById);
router.delete('/delete-anchal-area-allocation-id/:id', deleteAnchalArea);
router.put('/update-anchal-area-allocation-id/:id', updateAnchalArea);
router.delete(
  '/delete-soft-anchal-area-allocation-anchalId/:anchalId',
  softDeleteAnchalArea
);
router.delete(
  '/delete-soft-multi-anchal-area-allocation-anchalId',
  softDeleteMultipleAnchalAreas
);
router.put(
  '/update-recover-anchal-area-allocation-anchalId/:anchalId',
  recoverAnchalArea
);

router.put(
  '/update-recover-multi-anchal-area-allocation-anchalId',
  recoverMultipleAnchalAreas
);
//todo : allocation status
router.get('/get-allocation-status', allocatedStatus);

export default router;
