import mongoose from 'mongoose';

const gramSamarastaSchema = new mongoose.Schema({
    surveyerName: { type: String },
    village: { type: String },
    grampanchayat: { type: String },
    taluka: { type: String },
    district: { type: String },
    pinCode: { type: String},
 
    festivals: [{ type: String }],
    
    villageTemple: {
        type: String,
        enum: ['Yes', 'No'],
        
    },
    villageTempleName: {
        type: String,
        required: function() {
            return this.villageTemple === 'Yes';
        }
    },
    
    socialEvents: [{
        eventType: { 
            type: String, 
            enum: ['Ganesh Sthapana', 'Navratri', 'Other'] 
        },
        otherEventDetails: { 
            type: String,
            required: function() {
                return this.socialEvents?.eventType === 'Other';
            }
        }
    }],
    
    otherCommunityCenter: {
        type: String,
        enum: ['Yes', 'No'],
        
    },
    
    religiousPlaces: [{
        type: {
            type: String,
            enum: ['Temple', 'Church', 'Mosque', 'Other']
        },
        name: { 
            type: String,
            required: function() {
                return this.religiousPlaces?.type !== 'Other';
            }
        },
        otherSpecify: { 
            type: String,
            required: function() {
                return this.religiousPlaces?.type === 'Other';
            }
        }
    }],
    
    utsavMela: {
        type: String,
        enum: ['Yes', 'No'],
       
    },
    utsavMelaDetails: {
        type: String,
        required: function() {
            return this.utsavMela === 'Yes';
        }
    },
    
    kuldeviTemple: {
        type: String,
        enum: ['Yes', 'No'],
        
    },
    kuldeviTempleName: {
        type: String,
        required: function() {
            return this.kuldeviTemple === 'Yes';
        }
    },
    
    bhjanMandal: {
        type: String,
        enum: ['Yes', 'No'],
       
    },
    bhjanMandalName: {
        type: String,
        required: function() {
            return this.bhjanMandal === 'Yes';
        }
    },
    bhjanMandalContactNumber: {
        type: String,
        required: function() {
            return this.bhjanMandal === 'Yes';
        }
    },
    
    otherSocialWorkOrganizations: {
        type: String,
        enum: ['Yes', 'No'],
       
    },
    otherSocialWorkOrganizationsDetails: {
        type: String,
        required: function() {
            return this.otherSocialWorkOrganizations === 'Yes';
        }
    }
}, { timestamps: true });

export default mongoose.model('GramSamarasta', gramSamarastaSchema);