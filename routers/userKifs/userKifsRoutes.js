import express from 'express';
import multer from 'multer';
import { createUser, getUserById, updateUser, deleteUser, getUsersByRole } from '../../controllers/userKifs/userKifController.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Create dynamic field configuration for upload
const configureUpload = (req, res, next) => {
    // Extract number of vehicles from the request to configure multer fields
    let vehicleCount = 0;
    
    if (req.body.vehicles) {
        try {
            const vehiclesData = typeof req.body.vehicles === 'string' 
                ? JSON.parse(req.body.vehicles) 
                : req.body.vehicles;
                
            vehicleCount = Array.isArray(vehiclesData) ? vehiclesData.length : 0;
        } catch (error) {
            // If parsing fails, proceed with default fields
            console.error("Error parsing vehicles data:", error);
        }
    }
    
    // Create dynamic field configuration
    const fields = [
        { name: 'photo', maxCount: 1 },
        { name: 'licenseFile', maxCount: 1 }
    ];
    
    // Add numberplatephoto fields for each vehicle
    for (let i = 0; i < Math.max(10, vehicleCount); i++) {
        fields.push({ name: `numberplatephoto_${i}`, maxCount: 1 });
    }
    
    // Apply the upload middleware with the configured fields
    upload.fields(fields)(req, res, next);
};

router.post('/post-kif', configureUpload, createUser);
router.put('/:id', configureUpload, updateUser);
router.get('/by-role', getUsersByRole);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

export default router;