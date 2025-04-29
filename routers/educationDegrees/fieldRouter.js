// routes/fieldRoutes.js
import express from 'express';
import { getFieldsByType, addField } from '../../controllers/educationDegrees/fieldController.js';

const router = express.Router();

// Get fields by type
router.get('/:type', getFieldsByType);

// Add a new field
router.post('/', addField);

export default router;