const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Service type name is required'],
    trim: true,
    unique: true // ← this already creates the index
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['academic', 'administrative', 'support', 'extracurricular', 'other'],
    default: 'other'
  },
  defaultDuration: {
    type: Number, // in minutes
    default: 10,
    min: 1
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  icon: {
    type: String, // for UI purposes
    default: '📋'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Keep only the necessary indexes
serviceTypeSchema.index({ category: 1, isActive: 1 });
serviceTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
