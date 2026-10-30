const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Parent', parentSchema);
