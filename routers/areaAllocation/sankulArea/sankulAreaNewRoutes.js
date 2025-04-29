import express from 'express';
import {
  CreateSankulArea,
  deleteSankulArea,
  getAllSankulArea,
  getSankulAreaById,
  updateSankulArea,
} from '../../../controllers/areaAllocation/sankulArea/sankulAreaNewController.js';

import { isAuthenticated } from '../../../middlewares/auth.js';

const router = express.Router();



router.post('/post-sankul-area-allocation',
    isAuthenticated,

    CreateSankulArea);
router.get('/get-sankul-area-allocation', getAllSankulArea);
router.get('/get-sankul-area-allocation-id/:id', getSankulAreaById);
router.delete('/delete-sankul-area-allocation-id/:id', deleteSankulArea);
router.put('/update-sankul-area-allocation-id/:id', updateSankulArea);

export default router;
