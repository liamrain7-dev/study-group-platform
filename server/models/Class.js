const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  studyGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique class codes per university
classSchema.index({ code: 1, university: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);

