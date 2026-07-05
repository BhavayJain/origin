const express = require('express');
const repo = require('../services/repository');
const { sendBookingNotification } = require('../services/mailer');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{7,18}$/;

function sanitizeText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function validateBooking(input) {
  const errors = {};
  const date = new Date(input.preferredDate);

  if (!sanitizeText(input.studentName, 80)) errors.studentName = 'Student name is required.';
  if (!sanitizeText(input.parentName, 80)) errors.parentName = 'Parent name is required.';
  if (!phoneRegex.test(String(input.phone || '').trim())) errors.phone = 'Enter a valid phone number.';
  if (!emailRegex.test(String(input.email || '').trim())) errors.email = 'Enter a valid email address.';
  if (!input.preferredDate || Number.isNaN(date.getTime())) errors.preferredDate = 'Preferred date is required.';
  if (date < new Date(new Date().toDateString())) errors.preferredDate = 'Preferred date cannot be in the past.';
  if (!sanitizeText(input.preferredTime, 30)) errors.preferredTime = 'Preferred time is required.';
  if (!sanitizeText(input.branch, 80)) errors.branch = 'Select a branch.';
  const visitors = Number(input.visitors);
  if (!Number.isInteger(visitors) || visitors < 1 || visitors > 10) errors.visitors = 'Visitors must be between 1 and 10.';

  return errors;
}

router.get('/branches', async (req, res) => {
  res.json(await repo.getBranches());
});

router.get('/branches/:id', async (req, res) => {
  const branch = await repo.getBranch(req.params.id);
  if (!branch) return res.status(404).json({ message: 'Branch not found.' });
  res.json(branch);
});

router.get('/fees', async (req, res) => {
  res.json(await repo.getFees());
});

router.post('/bookings', async (req, res) => {
  const errors = validateBooking(req.body);
  if (Object.keys(errors).length) return res.status(422).json({ message: 'Please correct the highlighted fields.', errors });

  const branch = await repo.getBranch(req.body.branch);
  if (!branch) return res.status(422).json({ message: 'Selected branch is unavailable.', errors: { branch: 'Select a valid branch.' } });

  const booking = await repo.createBooking({
    studentName: sanitizeText(req.body.studentName, 80),
    parentName: sanitizeText(req.body.parentName, 80),
    phone: sanitizeText(req.body.phone, 20),
    email: sanitizeText(req.body.email, 120).toLowerCase(),
    preferredDate: new Date(req.body.preferredDate),
    preferredTime: sanitizeText(req.body.preferredTime, 30),
    branch: branch.id || branch._id,
    branchName: branch.name,
    visitors: Number(req.body.visitors),
    message: sanitizeText(req.body.message, 600)
  });

  sendBookingNotification(booking).catch((error) => console.error('Email notification failed:', error.message));
  res.status(201).json({ message: 'Tour booking request received.', booking });
});

module.exports = router;
