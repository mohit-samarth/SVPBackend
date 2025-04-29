
import mongoose from "mongoose";

const anchalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zone: { type: String, required: true },
  state: [{ type: String, required: true }],
  district: [{ type: String, required: true }],
  taluka: [{ type: String, required: true }],
  villages: [{ type: String, required: true }],
});
export const Anchal = mongoose.model("Anchal", anchalSchema);
