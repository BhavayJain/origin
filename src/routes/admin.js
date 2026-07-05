const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../services/repository');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function asList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
}

function branchPayload(body, file) {
  const payload = {
    name: String(body.name || '').trim(),
    address: String(body.address || '').trim(),
    phone: String(body.phone || '').trim(),
    mapUrl: String(body.mapUrl || '').trim(),
    mapEmbedUrl: String(body.mapEmbedUrl || '').trim(),
    admissionStatus: String(body.admissionStatus || 'Open'),
    description: String(body.description || '').trim(),
    facilities: asList(body.facilities)
  };
  if (file) payload.image = `/uploads/${file.filename}`;
  return payload;
}

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const admin = await repo.findAdminByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET || 'development-only-secret-change-me', { expiresIn: '8h' });
  res.json({ token, admin: { email: admin.email, name: admin.name, role: admin.role } });
});

router.get('/summary', requireAdmin, async (req, res) => {
  res.json(await repo.counts());
});

router.get('/bookings', requireAdmin, async (req, res) => {
  res.json(await repo.getBookings());
});

router.patch('/bookings/:id', requireAdmin, async (req, res) => {
  const status = String(req.body.status || '');
  if (!['Pending', 'Confirmed', 'Rejected'].includes(status)) return res.status(422).json({ message: 'Invalid booking status.' });
  const booking = await repo.updateBooking(req.params.id, { status, adminNote: String(req.body.adminNote || '').slice(0, 300) });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  res.json(booking);
});

router.post('/branches', requireAdmin, upload.single('image'), async (req, res) => {
  const payload = branchPayload(req.body, req.file);
  if (!payload.name || !payload.address) return res.status(422).json({ message: 'Branch name and address are required.' });
  const branch = await repo.createBranch(payload);
  res.status(201).json(branch);
});

router.put('/branches/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const branch = await repo.updateBranch(req.params.id, branchPayload(req.body, req.file));
  if (!branch) return res.status(404).json({ message: 'Branch not found.' });
  res.json(branch);
});

router.post('/fees', requireAdmin, async (req, res) => {
  const payload = {
    level: String(req.body.level || '').trim(),
    admissionFee: Number(req.body.admissionFee),
    monthlyTuition: Number(req.body.monthlyTuition),
    annualCharges: Number(req.body.annualCharges),
    transportFee: Number(req.body.transportFee || 0)
  };
  if (!payload.level || [payload.admissionFee, payload.monthlyTuition, payload.annualCharges].some(Number.isNaN)) {
    return res.status(422).json({ message: 'Complete all fee fields.' });
  }
  res.status(201).json(await repo.createFee(payload));
});

router.put('/fees/:id', requireAdmin, async (req, res) => {
  const fee = await repo.updateFee(req.params.id, {
    level: String(req.body.level || '').trim(),
    admissionFee: Number(req.body.admissionFee),
    monthlyTuition: Number(req.body.monthlyTuition),
    annualCharges: Number(req.body.annualCharges),
    transportFee: Number(req.body.transportFee || 0)
  });
  if (!fee) return res.status(404).json({ message: 'Fee row not found.' });
  res.json(fee);
});

module.exports = router;
