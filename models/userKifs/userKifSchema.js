import mongoose from "mongoose";

const userKifSchema = new mongoose.Schema(
  {
    // Personal Details
    role: { 
      type: String, 
      enum: ['Anchal', 'Sankul', 'Sanch', 'Upsanch'],      
  }, 
  // Personal Details
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String},
  mothersFirstName: { type: String },
  mothersMiddleName: { type: String },
  mothersLastName: { type: String },
  fathersFirstName: { type: String },
  fathersMiddleName: { type: String },
  fathersLastName: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String  },
  customGender: { type: String  },
  religion: { type: String },
  customReligion: { type: String },
  bloodGroup: { type: String},
  photo: { type: String},
  nationality: { type: String },

  // Academic Details
  schoolEducation: { type: String },
  standard: { type: String },
  graduationField: { type: String },
  graduation: { type: String },
  customGraduationField: { type: String }, 
  otherGraduationFields: [{type: String}], 
  postGraduationField: { type: String },
  postGraduation: { type: String },
  customPostGraduationField: { type: String },
  otherPostGraduationFields: [{ type: String }],
  diplomaField: { type: String },
  diploma: { type: String },
  customDiplomaField: { type: String },
  otherDiplomaFields: [{ type: String }],
  additionalGraduationFields: [{ type: String }],
  additionalPostGraduationFields: [{ type: String }],
  additionalDiplomaFields: [{ type: String }],
  certification: { type: String },

  // Communication Details
  state: { type: String },
  district: { type: String },
  taluka: { type: String},
  village: { type: String },
  houseAddress: { type: String },
  landmark: { type: String },
  pincode: { type: String },
  gramPanchayat: { type: String },
  email: { type: String },
  primaryMobileRelation: { type: String},
  familyRelation:{type:String},
  otherEmergencyRelation: { type: String},
  otherFamilyRelation: { type: String},
  countryCode: { type: String},
  primaryMobileNumber: { type: String},
  familyMobileNumber: { type: String },
  isWhatsappNumber: { type: Boolean, default: false },
  secondaryMobile: { type: String },
  whatsappNumber: { type: String },
  emergencyContact: { type: String},
  emergencyRelation: { type: String },

  // Legal Details
  hasPAN: { type: String },
  panNumber: { type: String },
  panName: { type: String },
  hasAadhar: { type: String},
  aadharNumber: { type: String },
  aadharName: { type: String },
  hasDrivingLicense: { type: String },
  licenseNumber: { type: String },
  licenseName: { type: String },
  licenseFile: { type: String },
  hasAyushmanCard: { type: String },
  ayushmanNumber: { type: String },
  abhaAddress: { type: String },
  hasPMJAY: { type: String},

  // Family Details
  isMarried: { type: String },
  spouseFirstName: { type: String },
  spouseMiddleName: { type: String },
  spouseLastName: { type: String },
  marriageDate: { type: Date,default:null },
  isSVPParticipant: { type: String},
  svpDesignation: { type: String },
  svpDateOfJoining: { type: Date,default:null },
  svpLocation: { type: String },
  svpDOB: { type: Date,default:null },
  otherFamilyMembers: [{
      name: { type: String },
      dob: { type: Date },
      relation: { type: String },
  }],


  // Social Details
  position: { type: String },
  customposition: { type: String },
  isBachatGatMember: { type: String },
  bachatGatGroupName: { type: String },
  bachatGatNumberOfPeople: { type: Number },
  bachatGatWorkDetails: { type: String },
  isKrushiGroupMember: { type: String },
  krushiGroupName: { type: String },
  krushiGroupNumberOfPeople: { type: Number },
  krushiGroupWorkDetails: { type: String },
  otherIncomeSource: { type: String},

  // Finance Details
  bankName: { type: String },
  nameOnBankAccount: { type: String},
  ifscCode: { type: String },
  bankBranch: { type: String },

  //convience details 
  ownVehicle: { type: String },
  vehicles: [{

      numberplatephoto: { type: String, },
      ownershipType: { type: String, },
      relation: { type: String, }, 
      vehicleType: { type: String, },
      purchaseDate: { type: Date, },
      insurance: { type: String, },
      insuranceExpiry: { type: Date,default:null }, 
      odometer: { type: String, },
    }],


},
  { timestamps: true }
);

export const UserKif = mongoose.model("UserKif", userKifSchema);
