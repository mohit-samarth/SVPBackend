import express from 'express';
import {
  createGramSamarasta,
  getGramSamarastaById,
  updateGramSamarasta,
  deleteGramSamarasta,
  getAllGramSamarasta
} from '../../controllers/gramsurvey/gramsamrastaController.js';

const router = express.Router();

router.route('/')
  .post(createGramSamarasta)
  .get(getAllGramSamarasta);

router.route('/:id')
  .get(getGramSamarastaById)
  .patch(updateGramSamarasta)
  .delete(deleteGramSamarasta);

export default router;