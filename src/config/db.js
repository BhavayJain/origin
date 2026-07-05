const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    global.__VIDYARUPA_DB_MODE__ = 'json-preview';
    return 'json-preview';
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
      dbName: undefined
    });
    global.__VIDYARUPA_DB_MODE__ = 'mongodb';
    return 'mongodb';
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('MongoDB unavailable; using JSON preview store. Set MONGO_URI for production.');
    global.__VIDYARUPA_DB_MODE__ = 'json-preview';
    return 'json-preview';
  }
}

function isMongo() {
  return global.__VIDYARUPA_DB_MODE__ === 'mongodb' && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isMongo };
