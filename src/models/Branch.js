const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: String,
  role: String,
  qualification: String,
  experience: String
}, { _id: false });

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  phone: String,
  mapUrl: String,
  mapEmbedUrl: String,
  image: String,
  heroImages: [String],
  facilities: [String],
  admissionStatus: { type: String, enum: ['Open', 'Limited Seats', 'Waitlist', 'Closed'], default: 'Open' },
  description: String,
  faculty: [FacultySchema],
  gallery: [String]
}, { timestamps: true });

module.exports = mongoose.model('Branch', BranchSchema);
