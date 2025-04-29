import mongoose from 'mongoose';
import validator from 'validator';
const gramSamitiInfoSchema = new mongoose.Schema({
  

  gramSamitiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GramSamiti',
    required: true
  },
  firstName: {
    type: String,
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
  },
  contactNo: {
    type: String,

    maxLength: [10, 'Contact No cannot exceed 10 numbers !'],
  },
  emailId: {
    type: String,
    validate: [validator.isEmail, 'Please provide valid email!'],
  },
  designationInSvpGramSamii: {
    type: String,
    enum: [
      'Pradhan',
      'Uppradhan',
      'Sachiv',
      'Upsachiv',
      'Sadasya1',
      'Sadasya2',
      'Sadasya3',
    ],
  },
  education: {
    type: String,
    enum: [
      'No Formal Education',
      'Primary (Class 1-4)',
      'Middle (Class 6-9)',
      '10th Pass',
      '12th Pass',
      'Diploma',
      'ITI (Industrial Training Institute)',
      'Graduate (Bachelor’s Degree)',
      'Postgraduate (Master’s Degree)',
      'M.Phil.',
      'Ph.D. (Doctorate)',
      'Professional Degree (CA, CS, ICWA, etc.)',
      'Other',
    ],
  },

  otherEducation: {
    type: String,
  },
  
  occupation: {
    type: String,
  },

  memberPhoto: {
    type: String,
  },
 
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GramSamitiInfo = mongoose.model(
  'GramSamitiInfo',
  gramSamitiInfoSchema
);

