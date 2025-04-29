import mongoose from 'mongoose';

const vidyarthiJankariPatrakSchema = new mongoose.Schema(
  {
    studFirstName: {
      type: String,
      required: [true, 'Student first name is required'],
      trim: true,
    },
    studMiddleName: {
      type: String,
      trim: true,
    },
    studLastName: {
      type: String,
      required: [true, 'Student last name is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: 'Invalid gender selected'
      },
      required: [true, 'Gender is required']
    },
    genderSpecify: {
      type: String,
      trim: true,
      // Only required if gender is 'Other'
      validate: {
        validator: function(value) {
          return this.gender !== 'Other' || (this.gender === 'Other' && value);
        },
        message: 'Please specify gender when selecting "Other"'
      }
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    religion: {
      type: String,
      enum: {
        values: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'],
        message: 'Invalid religion selected',
      },
      required: [true, 'Religion is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    subDistrict: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true,
    },
    gramPanchayat: {
      type: String,
      trim: true,
    },
    studentClass: {
      type: String,
      enum: {
        values: [
          '5th Class',
          '6th Class',
          '7th Class',
          '8th Class',
          '9th Class',
          '10th Class',
        ],
        message: 'Invalid student class selected',
      },
      required: [true, 'Student class is required'],
    },
    langOfEducation: {
      type: String,
      enum: {
        values: ['Marathi', 'English', 'Semi-English'],
        message: 'Invalid language of education selected',
      },
      required: [true, 'Language of education is required'],
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    fatherContactNo: {
      type: String,
      required: [true, "Father's contact number is required"],
      trim: true,
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
    },
    motherContactNo: {
      type: String,
      required: [true, "Mother's contact number is required"],
      trim: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
    studentPhoto: {
      type: String,
    },
    studentShortVieoAgreeSvpEnroll: {
      type: String,
    },
    parentPhoto: {
      type: String,
    },
    parentShortVieoAgreeSvpEnroll: {
      type: String,
    },
     createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    upSanchAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UpSanchAreaNew'
    },
    sanchAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SanchAreaNew'
    },
    sankulAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SankulAreaNew'
    },
    anchalAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnchalAreaNew'
    }
  },
  

  {
    timestamps: true,
    // Add this to ensure mongoose creates the collection if it doesn't exist
    strict: true,
  }
);

// Ensure indexes
vidyarthiJankariPatrakSchema.index(
  {
    studFirstName: 1,
    studLastName: 1,
    dateOfBirth: 1,
  },
  { unique: true }
);

export const VidyarthiJankariPatrak = mongoose.model(
  'VidyarthiJankariPatrak',
  vidyarthiJankariPatrakSchema
);



    // studentPhoto: {
    //   type: String,
    // },
    // studentShortVieoAgreeSvpEnroll: {
    //   type: String,
    // },
    // parentPhoto: {
    //   type: String,
    // },
    // parentShortVieoAgreeSvpEnroll: {
    //   type: String,
    // },
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
  // },
  // { timestamps: true }
