// models/fieldModel.js
import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['graduation', 'postgraduation', 'diploma'], required: true }
});

const Field = mongoose.model('Field', fieldSchema);

export default Field;