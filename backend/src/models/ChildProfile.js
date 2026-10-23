const mongoose = require('mongoose');

const childProfileSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, min: 1, max: 18, default: null },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('ChildProfile', childProfileSchema);
