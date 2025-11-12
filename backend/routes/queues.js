const express = require('express');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all active queues with statistics
// @route   GET /api/queues
// @access  Public (authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const { serviceType, isActive } = req.query;
    const filter = {};

    // Filter by service type if provided
    if (serviceType) {
      filter.serviceType = serviceType;
    }

    // Filter by active status if provided, otherwise show only active
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      filter.isActive = true;
    }

    const queues = await Queue.find(filter)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 });

    // Get waiting counts for each queue
    const queuesWithStats = await Promise.all(
      queues.map(async (queue) => {
        const waitingCount = await Ticket.countDocuments({
          queue: queue._id,
          status: 'waiting'
        });
        
        const activeCount = await Ticket.countDocuments({
          queue: queue._id,
          status: { $in: ['waiting', 'called'] }
        });

        return {
          ...queue.toObject(),
          waitingTickets: waitingCount,
          activeTickets: activeCount
        };
      })
    );

    res.json({
      status: 'success',
      results: queuesWithStats.length,
      data: {
        queues: queuesWithStats
      }
    });
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queues'
    });
  }
});

// @desc    Get single queue with detailed statistics
// @route   GET /api/queues/:id
// @access  Public (authenticated users)
router.get('/:id', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id)
      .populate('admin', 'name email');

    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Queue not found'
      });
    }

    // Get detailed statistics
    const waitingTickets = await Ticket.countDocuments({
      queue: queue._id,
      status: 'waiting'
    });

    const calledTickets = await Ticket.countDocuments({
      queue: queue._id,
      status: 'called'
    });

    const completedToday = await Ticket.countDocuments({
      queue: queue._id,
      status: 'completed',
      completedAt: {
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    });

    const queueWithStats = {
      ...queue.toObject(),
      stats: {
        waiting: waitingTickets,
        called: calledTickets,
        completedToday: completedToday,
        totalActive: waitingTickets + calledTickets
      }
    };

    res.json({
      status: 'success',
      data: {
        queue: queueWithStats
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queue'
    });
  }
});

// @desc    Create a new queue
// @route   POST /api/queues
// @access  Private (Admin/Teacher only)
router.post('/', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { name, description, serviceType, location, averageWaitTime, settings } = req.body;

    // Validation
    if (!name || !serviceType || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, service type, and location are required'
      });
    }

    // Check if queue with same name already exists (case insensitive)
    const existingQueue = await Queue.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      admin: req.user.id
    });

    if (existingQueue) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a queue with this name'
      });
    }

    const queue = new Queue({
      name,
      description,
      serviceType,
      location,
      averageWaitTime: averageWaitTime || 10,
      admin: req.user.id,
      settings: {
        meetingDuration: settings?.meetingDuration || 10,
        maxQueueLength: settings?.maxQueueLength || 50,
        autoCallNext: settings?.autoCallNext !== undefined ? settings.autoCallNext : true
      }
    });

    await queue.save();
    await queue.populate('admin', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Queue created successfully',
      data: {
        queue
      }
    });
  } catch (error) {
    console.error('Create queue error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to create queue'
    });
  }
});

// @desc    Update a queue
// @route   PUT /api/queues/:id
// @access  Private (Admin/Teacher only - must own the queue)
router.put('/:id', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const { name, description, serviceType, location, averageWaitTime, isActive, settings } = req.body;

    const queue = await Queue.findById(req.params.id);

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
        message: 'You can only update queues you manage'
      });
    }

    // Update fields if provided
    if (name) queue.name = name;
    if (description !== undefined) queue.description = description;
    if (serviceType) queue.serviceType = serviceType;
    if (location) queue.location = location;
    if (averageWaitTime) queue.averageWaitTime = averageWaitTime;
    if (isActive !== undefined) queue.isActive = isActive;

    // Update settings if provided
    if (settings) {
      queue.settings = {
        ...queue.settings,
        ...settings
      };
    }

    await queue.save();
    await queue.populate('admin', 'name email');

    res.json({
      status: 'success',
      message: 'Queue updated successfully',
      data: {
        queue
      }
    });
  } catch (error) {
    console.error('Update queue error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to update queue'
    });
  }
});

// @desc    Delete a queue
// @route   DELETE /api/queues/:id
// @access  Private (Admin/Teacher only - must own the queue)
router.delete('/:id', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

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
        message: 'You can only delete queues you manage'
      });
    }

    // Check if there are active tickets
    const activeTickets = await Ticket.findOne({
      queue: queue._id,
      status: { $in: ['waiting', 'called'] }
    });

    if (activeTickets) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete queue with active tickets. Please resolve all tickets first.'
      });
    }

    // Also delete all tickets for this queue
    await Ticket.deleteMany({ queue: queue._id });

    await Queue.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Queue deleted successfully'
    });
  } catch (error) {
    console.error('Delete queue error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete queue'
    });
  }
});

// @desc    Join a queue (create ticket)
// @route   POST /api/queues/:id/join
// @access  Private (all authenticated users)
router.post('/:id/join', protect, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue || !queue.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Queue not found or inactive'
      });
    }

    // Check if user already has an active ticket in this queue
    const existingTicket = await Ticket.findOne({
      queue: queue._id,
      user: req.user.id,
      status: { $in: ['waiting', 'called'] }
    });

    if (existingTicket) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active ticket in this queue'
      });
    }

    // Check queue capacity
    const waitingTicketsCount = await Ticket.countDocuments({
      queue: queue._id,
      status: 'waiting'
    });

    if (waitingTicketsCount >= queue.settings.maxQueueLength) {
      return res.status(400).json({
        status: 'error',
        message: 'Queue is currently full. Please try again later.'
      });
    }

    // Get next ticket number
    const lastTicket = await Ticket.findOne({ queue: queue._id })
      .sort({ ticketNumber: -1 });
    
    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // Calculate position and wait time
    const position = waitingTicketsCount + 1;
    const estimatedWaitTime = position * queue.averageWaitTime;

    const ticket = new Ticket({
      ticketNumber: nextTicketNumber,
      queue: queue._id,
      user: req.user.id,
      position: position,
      estimatedWaitTime: estimatedWaitTime,
      studentInfo: req.body.studentInfo || null
    });

    await ticket.save();
    
    // Populate for response
    await ticket.populate('queue', 'name serviceType location averageWaitTime settings');
    await ticket.populate('user', 'name email phone');

    res.status(201).json({
      status: 'success',
      message: 'Successfully joined the queue',
      data: {
        ticket
      }
    });
  } catch (error) {
    console.error('Join queue error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to join queue'
    });
  }
});

// @desc    Call next ticket in queue
// @route   POST /api/queues/:id/call-next
// @access  Private (Admin/Teacher only - must own the queue)
router.post('/:id/call-next', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

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
        message: 'You can only manage queues you administer'
      });
    }

    // Find next waiting ticket (lowest ticket number)
    const nextTicket = await Ticket.findOne({
      queue: queue._id,
      status: 'waiting'
    }).sort({ ticketNumber: 1 }).populate('user', 'name phone');

    if (!nextTicket) {
      return res.status(404).json({
        status: 'error',
        message: 'No waiting tickets in queue'
      });
    }

    // Update ticket status
    nextTicket.status = 'called';
    nextTicket.calledAt = new Date();
    await nextTicket.save();

    // Update queue current ticket
    queue.currentTicket = nextTicket.ticketNumber;
    await queue.save();

    // Populate for response
    await nextTicket.populate('queue', 'name location');

    res.json({
      status: 'success',
      message: `Ticket #${nextTicket.ticketNumber} called`,
      data: {
        ticket: nextTicket
      }
    });
  } catch (error) {
    console.error('Call next ticket error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to call next ticket'
    });
  }
});

// @desc    Get queue analytics
// @route   GET /api/queues/:id/analytics
// @access  Private (Admin/Teacher only - must own the queue)
router.get('/:id/analytics', protect, restrictTo('admin', 'teacher'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

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
        message: 'Access denied'
      });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Analytics queries
    const [
      totalTickets,
      completedToday,
      averageWaitTime,
      peakHour
    ] = await Promise.all([
      // Total tickets ever
      Ticket.countDocuments({ queue: queue._id }),
      
      // Completed today
      Ticket.countDocuments({
        queue: queue._id,
        status: 'completed',
        completedAt: { $gte: todayStart, $lte: todayEnd }
      }),
      
      // Average wait time (from completed tickets)
      Ticket.aggregate([
        {
          $match: {
            queue: queue._id,
            status: 'completed',
            calledAt: { $exists: true },
            completedAt: { $exists: true }
          }
        },
        {
          $addFields: {
            actualWaitTime: {
              $divide: [
                { $subtract: ['$calledAt', '$createdAt'] },
                60000 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgWaitTime: { $avg: '$actualWaitTime' }
          }
        }
      ]),
      
      // Peak hour (most tickets created in an hour)
      Ticket.aggregate([
        {
          $match: { queue: queue._id }
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 1
        }
      ])
    ]);

    const analytics = {
      totalTickets,
      completedToday,
      averageWaitTime: averageWaitTime[0]?.avgWaitTime ? Math.round(averageWaitTime[0].avgWaitTime) : queue.averageWaitTime,
      peakHour: peakHour[0]?._id?.hour || 'N/A',
      currentWaiting: await Ticket.countDocuments({
        queue: queue._id,
        status: 'waiting'
      }),
      efficiency: completedToday > 0 ? Math.round((completedToday / (completedToday + await Ticket.countDocuments({
        queue: queue._id,
        status: 'waiting'
      }))) * 100) : 0
    };

    res.json({
      status: 'success',
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;