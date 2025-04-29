import mongoose from 'mongoose';

const GramsavalambanSchema = new mongoose.Schema({
  surveyerName: { type: String },
  village: { type: String },
  grampanchayat: { type: String },
  taluka: { type: String, required: true },
  district: { type: String, required: true },
  pinCode: { type: String, required: true },
  
  primaryHealthCenter: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  primaryHealthCenterDistance: {
    type: Number,
    required: function() {
      return this.primaryHealthCenter === 'Yes';
    },
  },
  arogySevakName: {
    type: String,
    required: function() {
      return this.primaryHealthCenter === 'Yes';
    },
  },
  arogySevakContact: {
    type: String,
    required: function() {
      return this.primaryHealthCenter === 'Yes';
    },
  },
  
  policeStation: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  policeStationDistance: {
    type: Number,
    required: function() {
      return this.policeStation === 'Yes';
    },
  },
  policeAdhikariName: {
    type: String,
    required: function() {
      return this.policeStation === 'Yes';
    },
  },
  policeAdhikariContact: {
    type: String,
    required: function() {
      return this.policeStation === 'Yes';
    },
  },
  
  otherCommunityCenter: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  

  templeName: {
    type: String,
   
  },
  
  otherReligiousPlace: {
    type: {
      type: String,
      enum: ['Church', 'Majjid', 'Other', 'None'],
      required: true
    },
    specify: { 
      type: String,
      required: function() {
        return this.otherReligiousPlace.type === 'Other';
      }
    }
  },
  
  utsavOrMela: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  utsavOrMelaDetails: {
    type: String,
    required: function() {
      return this.utsavOrMela === 'Yes';
    },
  },
  
  roadCondition: {
    type: {
      type: String,
      enum: ['RCC', 'Asphalt', 'Row and Rough Streets', 'Other'],
      required: true
    },
    specify: { 
      type: String,
      required: function() {
        return this.roadCondition.type === 'Other';
      }
    }
  },
  
  mobileNetworkCall: {
    type: String,
    enum: ['good', 'weak', 'poor', 'no signal'],
    required: true
  },
  
  mobileNetworkInternet: {
    type: String,
    enum: ['good', 'weak', 'poor', 'no signal'],
    required: true
  },
  
  goodNetworkSim: {
    type: String,
    enum: ['Airtel', 'VI', 'Jio', 'BSNL'],
    required: true
  },
  
  sarpanch: {
    name: { type: String, required: true },
    contactNo: { type: String, required: true }
  },
  
  pramukh: {
    name: { type: String, required: true },
    contactNo: { type: String, required: true }
  },
  
  mahilaBachatGat: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  mahilaBachatGatGroups: {
    name: { 
      type: String,
      required: function() {
        return this.mahilaBachatGat === 'Yes';
      }
    },
    numberOfGroups: { 
      type: Number,
      required: function() {
        return this.mahilaBachatGat === 'Yes';
      }
    },
    sadasyaPerGroup: { 
      type: Number,
      required: function() {
        return this.mahilaBachatGat === 'Yes';
      }
    }
  },
  
  krishiGat: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  krishiGatGroups: {
    name: { 
      type: String,
      required: function() {
        return this.krishiGat === 'Yes';
      }
    },
    numberOfGroups: { 
      type: Number,
      required: function() {
        return this.krishiGat === 'Yes';
      }
    },
    sadasyaPerGroup: { 
      type: Number,
      required: function() {
        return this.krishiGat === 'Yes';
      }
    }
  },
  
  primaryAgriculturalProduction: {
    type: {
      type: String,
      enum: ['Rice', 'Jowar', 'Finger Millet', 'Barnyard Millet', 'Wheat', 'Other'],
      required: true
    },
    specify: { 
      type: String,
      required: function() {
        return this.primaryAgriculturalProduction.type === 'Other';
      }
    }
  },
  
  otherIncomeSource: {
    type: {
      type: String,
      enum: ['Labour', 'Goats', 'Poultry', 'Mango Tree', 'Other'],
      required: true
    },
    specify: { 
      type: String,
      required: function() {
        return this.otherIncomeSource.type === 'Other';
      }
    }
  },
  
  otherInformation: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Gramsavalamban', GramsavalambanSchema);