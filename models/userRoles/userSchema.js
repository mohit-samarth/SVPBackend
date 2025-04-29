// role: {
//   type: String,

//   required: [true, 'Please provide a role!'],
//   enum: [
//     'superAdmin',
//     'systemAdmin',
//     'anchalPramukh',
//     'sankulPramukh',
//     'sanchPramukh',
//     'upSanchPramukh',
//     'prashikshanPramukh',
//   ],
// },

import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Please provide your name!'],
    minLength: [3, 'Name must contain at least 3 characters!'],
    maxLength: [30, 'Name cannot exceed 30 characters!'],
    required: true,
  },

  svpEmail: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: [true, 'User already registered!'],
    validate: [validator.isEmail, 'Please provide valid email!'],
  },

  password: {
    type: String,
    required: [true, 'Please provide your password!'],
    minLength: [8, 'Password must contain at least 8 characters!'],
    select: false,
  },

  isPasswordChanged: {
    type: Boolean,
    default: false,
    select: false,
  },
  temporaryPassword: {
    type: String,
    select: false,
  },

  temporaryPasswordExpiresAt: {
    type: Date,
    select: false,
  },

  //*otp
  otp: {
    type: String,
    select: false,
  },
  otpExpiresAt: {
    type: Date,
    select: false,
  },

  role: {
    type: String,

    required: [true, 'Please provide a role!'],
    enum: [
      'superAdmin',
      'systemAdmin',
      'anchalPramukh',
      'sankulPramukh',
      'sanchPramukh',
      'upSanchPramukh',
      'aacharya',
      'pradhan',
      'uppradhan',
      'sachiv',
      'upsachiv',
      'sadasya1',
      'sadasya2',
      'sadasya3',
    ],
  },

  secondaryRole: {
    type: String,
    enum: ['prashikshanPramukh'],
  },
  newRole: {
    type: String,
  },

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

  anchalAreaFromUser: {
    type: String,
  },
  sankulAreaFromUser: {
    type: String,
  },
  sanchAreaFromUser: {
    type: String,
  },
  upSanchAreaFromUser: {
    type: String,
  },
  
  fcmToken: {
    type: String,
  },

  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  deletedAt: {
    type: Date,
    select: false,
  },
  createdFromKifId: {
    type: mongoose.Schema.ObjectId,
    ref: 'UserKif',
  },
  createdFromAacharyaKifId: {
    type: mongoose.Schema.ObjectId,
    ref: 'acharyaKifDetails',
  },
  gramSamitiId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamiti',
  },
  gsMemberPradhanId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberUppradhanId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberSachivId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberUpsachivId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberSadasya1Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberSadasya2Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },
  gsMemberSadasya3Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'GramSamitiInfo',
  },

  //!second role
  originalRole: {
    type: String,
  },
  originalAnchalAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnchalAreaNew',
  },
  originalAnchalAreaFromUser: {
    type: String,
  },
  isTemporaryRole: {
    type: Boolean,
    default: false,
  },
  // Added secondaryRole field
  secondaryRole: {
    type: String,
  },
  // Added secondaryRoleAssignedBy field
  secondaryRoleAssignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  roleSwitchHistory: [
    {
      previousRole: {
        type: String,
        required: true,
      },
      newRole: {
        type: String,
        required: true,
      },
      switchedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      switchedAt: {
        type: Date,
        default: Date.now,
      },
      isTemporary: {
        type: Boolean,
        default: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.isPasswordChanged) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    console.log('Entered Password:', enteredPassword);
    console.log('Stored Password:', this.password);

    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password Match:', isMatch);

    return isMatch;
  } catch (error) {
    console.error(error);
    return false;
  }
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model('User', userSchema);
