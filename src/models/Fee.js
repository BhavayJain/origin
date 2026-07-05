const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  level: { type: String, required: true },
  admissionFee: { type: Number, required: true },
  monthlyTuition: { type: Number, required: true },
  annualCharges: { type: Number, required: true },
  transportFee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Fee', FeeSchema);
