const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { isMongo } = require('../config/db');
const Branch = require('../models/Branch');
const Booking = require('../models/Booking');
const Fee = require('../models/Fee');
const Admin = require('../models/Admin');

const previewDbPath = path.join('/tmp', 'vidyarupa-discovery-preview-db.json');

function normalize(doc) {
  if (!doc) return null;
  const value = doc.toObject ? doc.toObject() : doc;
  value.id = String(value._id || value.id);
  delete value.__v;
  return value;
}

async function readStore() {
  try {
    return JSON.parse(await fs.readFile(previewDbPath, 'utf8'));
  } catch {
    return { branches: [], bookings: [], fees: [], admins: [] };
  }
}

async function writeStore(store) {
  await fs.writeFile(previewDbPath, JSON.stringify(store, null, 2));
}

function newId() {
  return crypto.randomUUID();
}

async function getBranches() {
  if (isMongo()) return (await Branch.find().sort({ createdAt: 1 })).map(normalize);
  const store = await readStore();
  return store.branches;
}

async function getBranch(id) {
  if (isMongo()) return normalize(await Branch.findById(id));
  const store = await readStore();
  return store.branches.find((branch) => branch.id === id || branch._id === id) || null;
}

async function createBranch(data) {
  if (isMongo()) return normalize(await Branch.create(data));
  const store = await readStore();
  const branch = { ...data, _id: newId(), id: undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  branch.id = branch._id;
  store.branches.push(branch);
  await writeStore(store);
  return branch;
}

async function updateBranch(id, data) {
  if (isMongo()) return normalize(await Branch.findByIdAndUpdate(id, data, { new: true, runValidators: true }));
  const store = await readStore();
  const index = store.branches.findIndex((branch) => branch.id === id || branch._id === id);
  if (index === -1) return null;
  store.branches[index] = { ...store.branches[index], ...data, updatedAt: new Date().toISOString() };
  await writeStore(store);
  return store.branches[index];
}

async function getFees() {
  if (isMongo()) return (await Fee.find().sort({ monthlyTuition: 1 })).map(normalize);
  const store = await readStore();
  return store.fees;
}

async function createFee(data) {
  if (isMongo()) return normalize(await Fee.create(data));
  const store = await readStore();
  const fee = { ...data, _id: newId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  fee.id = fee._id;
  store.fees.push(fee);
  await writeStore(store);
  return fee;
}

async function updateFee(id, data) {
  if (isMongo()) return normalize(await Fee.findByIdAndUpdate(id, data, { new: true, runValidators: true }));
  const store = await readStore();
  const index = store.fees.findIndex((fee) => fee.id === id || fee._id === id);
  if (index === -1) return null;
  store.fees[index] = { ...store.fees[index], ...data, updatedAt: new Date().toISOString() };
  await writeStore(store);
  return store.fees[index];
}

async function createBooking(data) {
  if (isMongo()) {
    const booking = await Booking.create(data);
    return normalize(await Booking.findById(booking._id).populate('branch', 'name address phone'));
  }
  const store = await readStore();
  const branch = store.branches.find((item) => item.id === data.branch || item._id === data.branch);
  const booking = {
    ...data,
    _id: newId(),
    id: undefined,
    branchName: branch?.name || data.branchName || '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  booking.id = booking._id;
  store.bookings.unshift(booking);
  await writeStore(store);
  return booking;
}

async function getBookings() {
  if (isMongo()) return (await Booking.find().sort({ createdAt: -1 }).populate('branch', 'name address phone')).map(normalize);
  const store = await readStore();
  return store.bookings;
}

async function updateBooking(id, data) {
  if (isMongo()) return normalize(await Booking.findByIdAndUpdate(id, data, { new: true }).populate('branch', 'name address phone'));
  const store = await readStore();
  const index = store.bookings.findIndex((booking) => booking.id === id || booking._id === id);
  if (index === -1) return null;
  store.bookings[index] = { ...store.bookings[index], ...data, updatedAt: new Date().toISOString() };
  await writeStore(store);
  return store.bookings[index];
}

async function findAdminByEmail(email) {
  if (isMongo()) return normalize(await Admin.findOne({ email: String(email).toLowerCase() }));
  const store = await readStore();
  return store.admins.find((admin) => admin.email === String(email).toLowerCase()) || null;
}

async function createAdmin(data) {
  if (isMongo()) return normalize(await Admin.create(data));
  const store = await readStore();
  const existing = store.admins.find((admin) => admin.email === data.email);
  if (existing) return existing;
  const admin = { ...data, _id: newId(), id: undefined, createdAt: new Date().toISOString() };
  admin.id = admin._id;
  store.admins.push(admin);
  await writeStore(store);
  return admin;
}

async function counts() {
  if (isMongo()) {
    const [branches, bookings, pending] = await Promise.all([
      Branch.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' })
    ]);
    return { branches, bookings, pending };
  }
  const store = await readStore();
  return {
    branches: store.branches.length,
    bookings: store.bookings.length,
    pending: store.bookings.filter((booking) => booking.status === 'Pending').length
  };
}

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  getFees,
  createFee,
  updateFee,
  createBooking,
  getBookings,
  updateBooking,
  findAdminByEmail,
  createAdmin,
  counts
};
