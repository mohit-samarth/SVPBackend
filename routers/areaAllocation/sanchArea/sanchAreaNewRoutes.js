
import express from "express";
import { CreateSanchArea,deleteSanchArea,getAllSanchArea,getSanchAreaById,updateSanchArea} from "../../../controllers/areaAllocation/sanchArea/sanchAreaNewController.js";



const router = express.Router();


router.post("/post-sanch-area-allocation", CreateSanchArea);
router.get("/get-sanch-area-allocation", getAllSanchArea);
router.get("/get-sanch-area-allocation-id/:id", getSanchAreaById);
router.delete("/delete-sanch-area-allocation-id/:id", deleteSanchArea);
router.put('/update-sanch-area-allocation-id/:id', updateSanchArea);


export default router;
