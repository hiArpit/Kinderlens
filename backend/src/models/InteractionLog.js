const mongoose = require('mongoose');

const interactionLogSchema = new mongoose.Schema(
  {
    outcome: {
      type: String,
      enum: ['identified', 'unidentified', 'unsafe', 'quiz'],
      required: true,
    },
    activityType: {
      type: String,
      enum: ['exploration', 'quiz'],
      default: 'exploration',
    },
    objectName: {
      type: String,
      trim: true,
      default: null,
    },
    kidSummary: {
      type: String,
      default: null,
    },
    funFact: {
      type: String,
      default: null,
    },
    actionPrompt: {
      type: String,
      default: null,
    },
    readability: {
      gradeLevel: {
        type: Number,
        default: null,
      },
      readingEase: {
        type: Number,
        default: null,
      },
      ageAppropriate: {
        type: Boolean,
        default: null,
      },
    },
    grounding: {
      grounded: {
        type: Boolean,
        default: false,
      },
      sourceTitle: {
        type: String,
        default: null,
      },
      sourceUrl: {
        type: String,
        default: null,
      },
    },
    confidenceNote: {
      type: String,
      default: null,
    },
    possibleObjects: {
      type: [String],
      default: [],
    },
    needsClearerImage: {
      type: Boolean,
      default: false,
    },
    quiz: {
      questionCount: {
        type: Number,
        default: null,
      },
      score: {
        type: Number,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('InteractionLog', interactionLogSchema);
