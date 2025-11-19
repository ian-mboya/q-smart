const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Queue name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  serviceType: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true 
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  currentTicket: { 
    type: Number, 
    default: 0 
  },
  averageWaitTime: { 
    type: Number, 
    default: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  settings: {
    meetingDuration: { 
      type: Number, 
      default: 10, // minutes
      min: 1
    },
    maxQueueLength: { 
      type: Number, 
      default: 50,
      min: 1
    },
    autoCallNext: {
      type: Boolean,
      default: true
    }
  }
}, { 
  timestamps: true 
});

// Indexes - no duplicates
queueSchema.index({ serviceType: 1, isActive: 1 });
queueSchema.index({ admin: 1 });

// Virtual for waiting tickets count (will be populated later)
queueSchema.virtual('waitingTickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'queue',
  count: true,
  match: { status: 'waiting' }
});

module.exports = mongoose.model('Queue', queueSchema);