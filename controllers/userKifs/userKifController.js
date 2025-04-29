import {UserKif} from '../../models/userKifs/userKifSchema.js'
import { validationResult } from 'express-validator';

export const createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = new UserKif({
            ...req.body,
            photo: req.files?.photo?.[0]?.path,
            licenseFile: req.files?.licenseFile?.[0]?.path,
        });

      // Handle vehicles if ownVehicle is "Yes"
      if (req.body.ownVehicle === "Yes" && req.files?.numberplatephoto) {
        console.log("Vehicles Data:", req.body.vehicles);
        try {
            const vehiclesArray = Array.isArray(req.body.vehicles)
                ? req.body.vehicles
                : JSON.parse(req.body.vehicles);

            user.vehicles = req.files.numberplatephoto.map((file, index) => ({
                ...vehiclesArray[index],
                numberplatephoto: file.path,
            }));
        } catch (error) {
            console.error("Error parsing vehicles data:", error);
            return res.status(400).json({ message: 'Invalid JSON format in vehicles field' });
        }
    }

        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error); // Log error details to the console
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};




// Backend - Update user controller
export const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Initialize updated data with basic fields
        const updatedData = { ...req.body };

        // Handle main files
        if (req.files?.photo?.[0]) {
            updatedData.photo = req.files.photo[0].path;
        }
        if (req.files?.licenseFile?.[0]) {
            updatedData.licenseFile = req.files.licenseFile[0].path;
        }

        // Handle vehicles data
        if (req.body.vehicles) {
            let vehiclesArray;
            
            try {
                // Handle both string and array inputs
                vehiclesArray = typeof req.body.vehicles === 'string' 
                    ? JSON.parse(req.body.vehicles)
                    : req.body.vehicles;

                if (!Array.isArray(vehiclesArray)) {
                    throw new Error('Vehicles must be an array');
                }

                // Process each vehicle
                updatedData.vehicles = vehiclesArray.map((vehicle, index) => {
                    const photoKey = `numberplatephoto_${index}`;
                    
                    // Convert dates if present
                    const purchaseDate = vehicle.purchaseDate ? new Date(vehicle.purchaseDate) : null;
                    const insuranceExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;

                    return {
                        ...vehicle,
                        numberplatephoto: req.files?.[photoKey]?.[0]?.path || vehicle.numberplatephoto,
                        purchaseDate,
                        insuranceExpiry
                    };
                });
            } catch (error) {
                console.error("Error processing vehicles data:", error);
                return res.status(400).json({ 
                    message: 'Invalid vehicles data format',
                    details: error.message
                });
            }
        }

          // Handle otherFamilyMembers
          if (req.body.otherFamilyMembers) {
            try {
                updatedData.otherFamilyMembers = JSON.parse(req.body.otherFamilyMembers)
                    .map(member => ({
                        name: member.name || '',
                        dob: member.dob === "null" ? null : 
                             member.dob ? new Date(member.dob) : null,
                        relation: member.relation || ''
                    }));
            } catch (error) {
                console.error("Error parsing otherFamilyMembers:", error);
                return res.status(400).json({ message: 'Invalid otherFamilyMembers format' });
            }
        }

          // Handle date fields
          const dateFields = [
            'marriageDate', 
            'svpDateOfJoining', 
            'svpDOB',
            'insuranceExpiry'
        ];

        dateFields.forEach(field => {
            if (req.body[field] === "null" || req.body[field] === null) {
                updatedData[field] = null;
            } else if (req.body[field]) {
                updatedData[field] = new Date(req.body[field]);
            }
        });

        // Rest of your existing update logic...
        const user = await UserKif.findByIdAndUpdate(
            req.params.id, 
            updatedData,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error("Update User Error:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid data type', 
                field: error.path, 
                value: error.value 
            });
        }

        res.status(500).json({ 
            message: 'Error updating user', 
            error: error.message 
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await UserKif.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await UserKif.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;

        if (!role) {
            return res.status(400).json({ message: "Role is required in the query parameter" });
        }


        const validRoles = ['Anchal', 'Sankul', 'Sanch', 'Upsanch'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Valid roles are: ${validRoles.join(', ')}` });
        }


        const users = await UserKif.find({ role });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users by role', error });
    }
};

