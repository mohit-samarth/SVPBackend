import express from "express";
import {
  createAnchal,
  getAnchals,
  getAnchalById,
  updateAnchal,
  deleteAnchal,
} from "../../controllers/userArea/anchalController.js";

const router = express.Router();

router.post("/post-anchal-area", createAnchal);
router.get("/get-all-anchal-area", getAnchals);
router.get("/get-single-anchal-area/:id", getAnchalById);
router.put("/put-single-anchal-area/:id", updateAnchal);
router.delete("/delete-single-anchal-area/:id", deleteAnchal);

export default router;
