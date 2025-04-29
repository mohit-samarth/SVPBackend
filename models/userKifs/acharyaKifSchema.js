import mongoose from 'mongoose';
const { Schema } = mongoose;

const AcharyaFormSchema = new mongoose.Schema({
  svpId: { type: String },
  svpName: { type: String },
  anchalAreaId: {
    type: mongoose.Schema.ObjectId,
    ref: 'AnchalAreaNew',
  },
  sankulAreaId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SankulAreaNew',
  },
  sanchAreaId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SanchAreaNew',
  },
  upSanchAreaId: {
    type: mongoose.Schema.ObjectId,
    ref: 'UpSanchAreaNew',
  },
  isPartialKif: {
    type: Boolean,
    default: false
  },
  isUpdated: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  completeKifSubmittedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['partial', 'interview_completed', 'assessment_completed', 'selected', 'rejected', 'on_old'],
    default: 'partial'
  },
  completedAt: {
    type: Date
  },
  //personal details
  firstName: { type: String, },
  middleName: { type: String, },
  lastName: { type: String, },
  fatherFirstName: { type: String, },
  fatherMiddleName: { type: String, },
  fatherLastName: { type: String, },
  motherFirstName: { type: String, },
  motherMiddleName: { type: String, },
  motherLastName: { type: String, },
  gender: { type: String, },
  customGender: { type: String, },
  customReligion: { type: String, },
  religion: { type: String, },
  bloodGroup: { type: String, },
  nationality: { type: String, default: 'India' },
  photo: { type: String, },
  dateOfBirth: {
    type: Date,
    set: (value) => (typeof value === 'string' ? new Date(value) : value),
    default: Date.now,
  },

  // family details
  married: { type: String },
  spouseName: { type: String, },
  spouseMiddleName: { type: String, },
  spouseLastName: { type: String, },
  marriageDate: { type: Date, },
  svpParticipant: { type: String, },
  svpDesignation: { type: String, },
  dateOfJoining: { type: Date, },
  location: { type: String, },
  otherFamilyMembers: [{
    name: { type: String },
    dob: { type: Date },
    relation: { type: String },
  }],

  // education details
  educationLevel: { type: String, },
  standard: { type: String, },
  graduationField: { type: String, },
  postGraduationField: { type: String, },
  diplomaField: { type: String, },
  otherSkills: { type: String, },
  certification: { type: String, },
  certificationFile: { type: String, },
  languages: [
    {
      name: { type: String, },
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      speak: { type: Boolean, default: false },
      understand: { type: Boolean, default: false }
    }
  ],
  newLanguage: { type: String, },

  // communication details
  state: { type: String, },
  district: { type: String, },
  taluka: { type: String, },
  village: { type: String, },
  pincode: { type: String, },
  houseAddress: { type: String, },
  landmark: { type: String, },
  grampanchayat: { type: String, },
  primaryPhoneType: { type: String, default: 'own' },
  countryCode: { type: String },
  primaryPhoneNumber: { type: String, },
  Familyphonenumber: { type: String, },
  primaryPhoneRelation: { type: String, },
  primaryPhoneRelationOther: { type: String, },
  isWhatsApp: Boolean,
  secondaryPhoneType: { type: String, },
  secondaryPhoneNumber: { type: String, },
  FamilySecondaryphonenumber: { type: String, },
  secondaryPhoneRelation: { type: String, },
  secondaryPhoneRelationOther: { type: String, },
  emergencyPhoneType: { type: String, default: 'own' },
  emergencyPhoneNumber: { type: String, },
  FamilyEmergencyphonenumber: { type: String, },
  emergencyPhoneRelation: { type: String, },
  emergencyPhoneRelationOther: { type: String, },

  // legal details
  panCardDetails: { type: String, },
  panNumber: { type: String, },
  panName: { type: String, },
  aadharDetails: { type: String, },
  aadharNumber: { type: String, },
  aadharName: { type: String, },
  drivingLicenseDetails: { type: String, },
  licenseNumber: { type: String, },
  licenseName: { type: String, },
  licenseFile: { type: String, },
  ayushmanDetails: { type: String, },
  ayushmanNumber: { type: String, },
  abhaAddress: { type: String, },
  pmjayDetails: { type: String, },

  // social details
  position: { type: String, },
  specifiedPosition: { type: String, },
  bachatgat: { type: String, },
  bachatgatGroupName: { type: String, },
  bachatgatPeople: { type: String, },
  bachatgatWork: { type: String, },
  krushiGroup: { type: String, },
  krushiGroupName: { type: String, },
  krushiGroupPeople: { type: String, },
  krushiGroupWork: { type: String, },
  otherIncomeSource: { type: String, },

  // bank details
  bankName: { type: String, },
  accountName: { type: String, },
  ifscCode: { type: String, },
  branchName: { type: String, },

  // conveyance details
  hasVehicle: { type: String, },
  vehicles: [{

    numberplatephoto: { type: String, },
    ownershipType: { type: String, },
    relation: { type: String, }, // Optional
    vehicleType: { type: String, },
    purchaseDate: { type: Date, },
    insurance: { type: String, },
    insuranceExpiry: { type: Date, }, // Optional
    odometer: { type: String, },
  }],

  interviewStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed','on_hold'],
    default: 'pending'
  },
  interviewCompletedAt: {
    type: Date
  },


  // Exam assessments
  exam1Status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  exam1CompletedAt: {
    type: Date
  },


  exam2Status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  exam2CompletedAt: {
    type: Date
  },

  //  // Interview fields
  //  interviewCompleted: {
  //   type: Boolean,
  //   default: false
  // },
  // interviewNotes: {
  //   type: String,
  //   default: ''
  // },
  // interviewCompletedBy: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  // interviewCompletedAt: {
  //   type: Date
  // },

  // // Exam fields
  // examCompleted: {
  //   type: Boolean,
  //   default: false
  // },
  // examScore: {
  //   type: Number,
  //   default: 0
  // },
  // examNotes: {
  //   type: String,
  //   default: ''
  // },
  // examCompletedBy: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  // examCompletedAt: {
  //   type: Date
  // },

  // // Selection fields
  // selectionStatus: {
  //   type: String,
  //   enum: ['pending', 'selected', 'rejected', 'on_hold'],
  //   default: 'pending'
  // },
  // selectionRemarks: {
  //   type: String,
  //   default: ''
  // },
  // selectedBy: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  // selectionDate: {
  //   type: Date
  // },
});

const Form = mongoose.model('acharyaKifDetails', AcharyaFormSchema);

export default Form;
