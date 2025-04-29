// models/VillageSurvey.js
import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  medium: {
    type: String,
    enum: ['Marathi', 'Hindi', 'English', 'Semi-English'],
    required: true
  },
  students: {
    boys: {
      type: Number,
      default: 0
    },
    girls: {
      type: Number,
      default: 0
    },
    class4: {
      type: Number,
      default: 0
    },
    class5: {
      type: Number,
      default: 0
    },
    class8: {
      type: Number,
      default: 0
    },
    class10: {
      type: Number,
      default: 0
    }
  },
  principal: {
    name: {
      type: String,
      required: true
    },
    contactNo: {
      type: String,
      required: true
    }
  },
  smcMember: {
    name: {
      type: String,
      required: true
    },
    contactNo: {
      type: String,
      required: true
    }
  }
});

const villageSurveySchema = new mongoose.Schema({
  surveyer: {
    type: String,
  },
  village: {
    type: String,
  },
  gramPanchayat: {
    type: String,
  },
  taluka: {
    type: String,
  },
  district: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  population: {
    males: {
      type: Number,
    },
    females: {
      type: Number,
    },
    total: {
      type: Number,
    }
  },
  houses: {
    type: Number,
   
  },
  families: {
    type: Number,
   
  },
  govtSchools: {
    exists: {
      type: Boolean,
      default: false
    },
    schools: [schoolSchema]
  },
  pvtSchools: {
    exists: {
      type: Boolean,
      default: false
    },
    schools: [schoolSchema]
  },
  ashramshala: {
    exists: {
      type: Boolean,
      default: false
    },
    schools: [schoolSchema]
  },
  sixtoeightstudentsankhya: {
    boys: {
      type: Number,
      default: 0
    },
    girls: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  surveyCompleted:{
    type: Boolean,
    default: false
  },
  surveyCompletedAt :{
    type: Date,
    default: null
  }
  
});

// Update the updatedAt field on every save
villageSurveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const VillageSurvey = mongoose.model('VillageSurvey', villageSurveySchema);

export default VillageSurvey;