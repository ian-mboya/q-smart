const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { 
    type: Number, 
    required: true 
  },
  queue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Queue', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['waiting', 'called', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting' 
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  position: {
    type: Number,
    required: true
  },
  calledAt: Date,
  completedAt: Date,
  studentInfo: {
    name: String,
    grade: String,
    studentId: String
  }
}, { 
  timestamps: true 
});

// Compound index for unique ticket number per queue
ticketSchema.index({ queue: 1, ticketNumber: 1 }, { unique: true });

// Other indexes (no duplicates)
ticketSchema.index({ queue: 1, status: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ status: 1, position: 1 });

// Pre-save middleware to update timestamps
ticketSchema.pre('save', function(next) {
  if (this.status === 'called' && !this.calledAt) {
    this.calledAt = new Date();
  }
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);