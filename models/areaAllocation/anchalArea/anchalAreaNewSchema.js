// import mongoose from 'mongoose';

// const villageSchema = new mongoose.Schema({
//   villageName: { type: String, required: true },
//   isAllocated: { type: Boolean, default: false }, // Track if the village is allocated
// });

// const subdistrictSchema = new mongoose.Schema({
//   subDistrictName: { type: String, required: true },
//   isAllocated: { type: Boolean, default: false }, // Track if the subdistrict is allocated
//   villages: [villageSchema],
// });

// const districtSchema = new mongoose.Schema({
//   districtName: { type: String, required: true },
//   isAllocated: { type: Boolean, default: false }, // Track if the district is allocated
//   subdistricts: [subdistrictSchema],
// });

// const stateSchema = new mongoose.Schema({
//   stateName: { type: String, required: true },
//   isAllocated: { type: Boolean, default: false }, // Track if the state is allocated
//   districts: [districtSchema],
// });

// const anchalAreaNewSchema = new mongoose.Schema({
//   zoneName: { type: String, required: true },
//   isAllocated: { type: Boolean, default: false }, // Track if the zone is allocated
//   states: [stateSchema],
//   anchalName: { type: String, required: true },
//   isDeleted: { type: Boolean, default: false },
//   deletedAt: { type: Date, default: null },
// });

// export const AnchalAreaNew = mongoose.model(
//   'AnchalAreaNew',
//   anchalAreaNewSchema
// );

// Add a compound index that's not unique
// anchalAreaNewSchema.index({ anchalName: 1, isDeleted: 1 });

//!or

import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema({
  villageName: { type: String, required: true },
});

const subdistrictSchema = new mongoose.Schema({
  subDistrictName: { type: String, required: true },
  villages: [villageSchema],
});

const districtSchema = new mongoose.Schema({
  districtName: { type: String, required: true },
  subdistricts: [subdistrictSchema],
});

const stateSchema = new mongoose.Schema({
  stateName: { type: String, required: true },
  districts: [districtSchema],
});

const anchalAreaNewSchema = new mongoose.Schema({
  zoneName: { type: String, required: true },
  states: [stateSchema],
  anchalName: { type: String, required: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

anchalAreaNewSchema.index(
  { anchalName: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { isDeleted: false },
  }
);


export const AnchalAreaNew = mongoose.model(
  'AnchalAreaNew',
  anchalAreaNewSchema
);
