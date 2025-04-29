import express from 'express';
import {
  CreateUpSanchArea,
  deleteUpSanchArea,
  getAllUpSanchArea,
  getUpSanchAreaById,
  updateUpsanchArea,
  getHierarchicalNames,

} from '../../../controllers/areaAllocation/upsanchArea/upsanchAreaNewController.js';

const router = express.Router();

router.post('/post-upSanch-area-allocation', CreateUpSanchArea);
router.get('/get-upSanch-area-allocation', getAllUpSanchArea);
router.get('/get-upSanch-area-allocation-id/:id', getUpSanchAreaById);
router.delete('/delete-upSanch-area-allocation-id/:id', deleteUpSanchArea);
router.put('/update-up-sanch-area-allocation-id/:id', updateUpsanchArea);

router.get('/get-area-allocation-hierachy-names', getHierarchicalNames);


export default router;
