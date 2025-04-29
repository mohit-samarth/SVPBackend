// controllers/fieldController.js
import Field from '../../models/educationDegrees/fieldSchema.js';

// Get all fields by type
export const getFieldsByType = async (req, res) => {
    const { type } = req.params;
    try {
        const fields = await Field.find({ type });
        res.status(200).json(fields);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new field
export const addField = async (req, res) => {
    const { name, type } = req.body;
  
    try {
      // Check if a field with the same name already exists
      const existingField = await Field.findOne({ name });
      if (existingField) {
        return res.status(400).json({ message: 'Field with this name already exists.' });
      }
  
      // Create and save the new field
      const newField = new Field({ name, type });
      const savedField = await newField.save();
      res.status(201).json(savedField);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  