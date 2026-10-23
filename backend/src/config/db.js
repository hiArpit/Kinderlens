const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinderlens';

const connectDatabase = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
