const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  parentName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  branchName: String,
  visitors: { type: Number, min: 1, max: 10, default: 2 },
  message: String,
  status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected'], default: 'Pending' },
  adminNote: String
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
