import express from 'express';
import {
  createGramsavalamban,
  getGramsavalamban,
  updateGramsavalamban,
  deleteGramsavalamban,
  getAllGramsavalamban
} from '../../controllers/gramsurvey/gramsvavlambanController.js';

const router = express.Router();

// Create a new Gramsavalamban entry
router.post('/gram-svavlamban-create', createGramsavalamban);

// Get all Gramsavalamban entries with pagination
router.get('/', getAllGramsavalamban);

// Get a specific Gramsavalamban entry by ID
router.get('/:id', getGramsavalamban);

// Update a Gramsavalamban entry
router.put('/:id', updateGramsavalamban);

// Delete a Gramsavalamban entry
router.delete('/:id', deleteGramsavalamban);

export default router;