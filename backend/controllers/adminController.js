const User = require('../models/User');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQueues = await Queue.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const activeTickets = await Ticket.countDocuments({ status: { $ne: 'completed' } });
    
    // Count users by role
    const userDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Count tickets by status
    const ticketDistribution = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQueues,
          totalTickets,
          activeTickets
        },
        userDistribution: userDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ticketDistribution: ticketDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    res.status(201).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get System Analytics
exports.getSystemAnalytics = async (req, res) => {
  try {
    // Performance metrics
    const uptime = process.uptime();
    const systemUptime = 99.8; // placeholder - calculate based on your needs

    // Get ticket data for analytics
    const tickets = await Ticket.find({});
    const completedTickets = tickets.filter(t => t.status === 'completed');
    
    // Calculate average resolution time
    const avgTicketResolution = completedTickets.length > 0
      ? completedTickets.reduce((sum, t) => {
          if (t.completedAt && t.createdAt) {
            return sum + (t.completedAt - t.createdAt) / (1000 * 60); // convert to minutes
          }
          return sum;
        }, 0) / completedTickets.length
      : 0;

    // Get peak usage hours (tickets created per hour)
    const peakUsageHours = Array(24).fill(0).map((_, hour) => ({
      hour,
      ticketCount: tickets.filter(t => new Date(t.createdAt).getHours() === hour).length
    }));

    // Recent activity (last 6 activities)
    const recentActivity = await Ticket.find({})
      .populate('queue', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('status title queue user studentInfo createdAt');

    // Count queues by status
    const queueStats = await Queue.find({}).select('name subject teacher totalTickets activeTickets avgWaitTime');

    res.status(200).json({
      success: true,
      data: {
        performance: {
          systemUptime,
          avgTicketResolution: Math.round(avgTicketResolution),
          peakUsageHours
        },
        recentActivity: recentActivity.map(activity => ({
          _id: activity._id,
          title: activity.queue?.name || 'Unknown',
          status: activity.status,
          queue: activity.queue,
          student: activity.user,
          createdAt: activity.createdAt
        })),
        queueStats
      }
    });
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system analytics',
      error: error.message
    });
  }
};
