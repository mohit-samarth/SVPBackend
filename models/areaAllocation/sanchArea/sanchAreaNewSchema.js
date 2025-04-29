import mongoose from "mongoose";

const villageSchema = new mongoose.Schema({
    villageName: { type: String, required: true },
});

const subdistrictSchema = new mongoose.Schema({
    subDistrictName: { type: String, required: true },
    villages: [villageSchema], // Embedded villages
});

const districtSchema = new mongoose.Schema({
    districtName: { type: String, required: true },
    subdistricts: [subdistrictSchema], // Embedded subdistricts
});

const stateSchema = new mongoose.Schema({
    stateName: { type: String, required: true },
    districts: [districtSchema], // Embedded districts
});

const sanchAreaNewSchema = new mongoose.Schema({
    zoneName: { type: String, required: true },
    states: [stateSchema], // Embedded states


    anchalName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AnchalAreaNew'
    },
    sankulName: {
              type: mongoose.Schema.Types.ObjectId,
        ref: 'SankulAreaNew'
      

    },
    sanchName:{
        type:String

    }

});

export const SanchAreaNew = mongoose.model("SanchAreaNew", sanchAreaNewSchema);