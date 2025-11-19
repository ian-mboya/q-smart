const express = require('express');
const Ticket = require('../models/Ticket');
const Queue = require('../models/Queue');
const { protect, restrictTo } = require('../middleware/auth');
const socketUtils = require('../utils/socketUtils'); // <-- added

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get current user's active tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
router.get('/my-tickets', async (req, res) => {
  try {
    // Get all tickets for the user (active, completed, and cancelled)
    // Include the 'in-progress' status as well
    const tickets = await Ticket.find({ 
      user: req.user.id,
      status: { $in: ['waiting', 'called', 'in-progress', 'completed', 'cancelled'] }
    })
    .populate({
      path: 'queue',
      populate: {
        path: 'serviceType',
        model: 'ServiceType'
      }
    })
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your tickets'
    });
  }
});

// @desc    Get user's active ticket for a specific queue
// @route   GET /api/tickets/my-ticket
// @access  Private
router.get('/my-ticket', async (req, res) => {
  try {
    const { queue } = req.query;
    
    if (!queue) {
      return res.status(400).json({
        status: 'error',
        message: 'Queue ID is required'
      });
    }

    const ticket = await Ticket.findOne({
      user: req.user.id,
      queue: queue,
      status: { $in: ['waiting', 'called', 'in-progress'] }
    }).populate({
      path: 'queue',
      populate: {
        path: 'serviceType',
        model: 'ServiceType'
      }
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'No active ticket found for this queue'
      });
    }

    // Update position based on current queue state
    const waitingAhead = await Ticket.countDocuments({
      queue: queue,
      status: 'waiting',
      ticketNumber: { $lt: ticket.ticketNumber }
    });

    ticket.position = waitingAhead + 1;
    
    // Recalculate estimated wait time
    if (ticket.status === 'waiting') {
      const queueData = await Queue.findById(queue);
      ticket.estimatedWaitTime = ticket.position * (queueData?.averageWaitTime || 10);
    }

    res.json({
      status: 'success',
      data: {
        ticket,
        queue: ticket.queue
      }
    });
  } catch (error) {
    console.error('Get my ticket error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your ticket'
    });
  }
});

// @desc    Get all tickets for a queue (for managers)
// @route   GET /api/tickets/queue/:queueId
// @access  Private (Admin/Teacher only - must own the queue)
router.get('/queue/:queueId', restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.queueId);
    
    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Queue not found'
      });
    }

    // Check ownership
    if (queue.admin.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to queue tickets'
      });
    }

    const { status, limit = 50 } = req.query;
    const filter = { queue: req.params.queueId };
    
    if (status) {
      filter.status = status;
    }

    const tickets = await Ticket.find(filter)
      .populate('user', 'name email phone')
      .sort({ ticketNumber: 1 })
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  } catch (error) {
    console.error('Get queue tickets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queue tickets'
    });
  }
});

// @desc    Update ticket status
// @route   PATCH /api/tickets/:id/status
// @access  Private (Admin/Teacher only - must own the queue)
router.patch('/:id/status', restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id).populate('queue');

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    // Check queue ownership
    if (ticket.queue.admin.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to update ticket'
      });
    }

    // Validate status transition
    const validTransitions = {
      'waiting': ['called', 'cancelled'],
      'called': ['in-progress', 'completed', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[ticket.status]?.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status transition from ${ticket.status} to ${status}`
      });
    }

    ticket.status = status;
    
    // Update timestamps
    if (status === 'called' && !ticket.calledAt) {
      ticket.calledAt = new Date();
    } else if (status === 'completed' && !ticket.completedAt) {
      ticket.completedAt = new Date();
    }

    await ticket.save();

    // Update queue current ticket if completed
    if (status === 'completed') {
      await Queue.findByIdAndUpdate(ticket.queue._id, {
        currentTicket: ticket.ticketNumber
      });
    }

    await ticket.populate('user', 'name phone');
    await ticket.populate({
      path: 'queue',
      populate: {
        path: 'serviceType',
        model: 'ServiceType'
      }
    });

    res.json({
      status: 'success',
      message: `Ticket status updated to ${status}`,
      data: {
        ticket
      }
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update ticket status'
    });
  }
});

// @desc    Cancel a ticket
// @route   PATCH /api/tickets/:id/cancel
// @access  Private (Ticket owner or queue manager)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('queue');

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    // Check permissions: ticket owner or queue manager
    const isOwner = ticket.user.toString() === req.user.id;
    const isManager = ticket.queue.admin.toString() === req.user.id || req.user.role === 'admin';

    if (!isOwner && !isManager) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to cancel ticket'
      });
    }

    // Only allow cancellation of waiting or called tickets
    if (!['waiting', 'called'].includes(ticket.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a ticket that is already completed or in progress'
      });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    res.json({
      status: 'success',
      message: 'Ticket cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel ticket'
    });
  }
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (Ticket owner or queue manager)
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'queue',
        populate: {
          path: 'serviceType',
          model: 'ServiceType'
        }
      })
      .populate('user', 'name email phone');

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    // Check permissions
    const isOwner = ticket.user._id.toString() === req.user.id;
    const isManager = ticket.queue.admin.toString() === req.user.id || req.user.role === 'admin';

    if (!isOwner && !isManager) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to view ticket'
      });
    }

    res.json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ticket'
    });
  }
});

// Example: ticket create handler (insert the emit after ticket creation)
router.post('/', protect, async (req, res, next) => {
  try {
    // ...existing code that builds ticketData...
    const ticket = await Ticket.create(ticketData);

    // respond first
    res.status(201).json({ status: 'success', data: { ticket } });

    // emit socket events (fire-and-forget)
    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-created');
    } catch (err) {
      console.warn('Socket emit (ticket-created) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

// Example: ticket update handler (insert emit after update)
router.put('/:id', protect, async (req, res, next) => {
  try {
    // ...existing update logic...
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('queue').exec();

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    res.json({ status: 'success', data: { ticket } });

    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-updated');
    } catch (err) {
      console.warn('Socket emit (ticket-updated) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

// @desc    Call a specific ticket (mark as called/in-progress)
// @route   PUT /api/tickets/:id/call
// @access  Private (admin, teacher)
router.put('/:id/call', protect, restrictTo('admin','teacher'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'called',
        calledAt: new Date()
      }, 
      { new: true }
    )
    .populate('user', 'name email')
    .populate('queue', 'name teacher')
    .populate('queue.teacher', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Ticket not found' 
      });
    }

    res.json({ 
      status: 'success', 
      message: 'Ticket called successfully',
      data: { ticket } 
    });

    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-called');
    } catch (err) {
      console.warn('Socket emit (ticket-called) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

// @desc    Complete a ticket (mark as completed)
// @route   PUT /api/tickets/:id/complete
// @access  Private (admin, teacher)
router.put('/:id/complete', protect, restrictTo('admin','teacher'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'completed', 
        completedAt: new Date() 
      }, 
      { new: true }
    )
    .populate('user', 'name email')
    .populate('queue', 'name teacher')
    .populate('queue.teacher', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Ticket not found' 
      });
    }

    res.json({ 
      status: 'success', 
      message: 'Ticket completed successfully',
      data: { ticket } 
    });

    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-completed');
    } catch (err) {
      console.warn('Socket emit (ticket-completed) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

// Backward compatibility: also support POST for complete
router.post('/:id/complete', protect, restrictTo('admin','teacher'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'completed', 
        completedAt: new Date() 
      }, 
      { new: true }
    )
    .populate('user', 'name email')
    .populate('queue', 'name teacher')
    .populate('queue.teacher', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Ticket not found' 
      });
    }

    res.json({ 
      status: 'success', 
      message: 'Ticket completed successfully',
      data: { ticket } 
    });

    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-completed');
    } catch (err) {
      console.warn('Socket emit (ticket-completed) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

// Example: ticket delete/cancel handler -> emit 'ticket-removed'
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id).populate('queue').exec();

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    res.json({ status: 'success', message: 'Ticket deleted', data: { ticket } });

    try {
      await socketUtils.emitTicketEvent(ticket, 'ticket-removed');
    } catch (err) {
      console.warn('Socket emit (ticket-removed) failed', err);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;