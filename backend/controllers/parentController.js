const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Queue = require('../models/Queue');

// Get parent's children
exports.getMyChildren = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    console.log('🔍 getMyChildren - Parent ID:', parentId);
    
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    const parent = await User.findById(parentId).select('children name email');
    console.log('👨 Parent found:', parent?.name);
    console.log('📊 Parent has children field?', !!parent?.children);
    console.log('📋 Parent children count:', parent?.children?.length || 0);
    console.log('📋 Parent children array:', JSON.stringify(parent?.children || []));
    
    if (!parent) {
      console.log('❌ Parent not found');
      return res.status(404).json({ 
        status: 'error',
        message: 'Parent not found'
      });
    }
    
    if (!parent.children || parent.children.length === 0) {
      console.log('⚠️  No children found for parent');
      return res.json({ 
        status: 'success', 
        data: [] 
      });
    }

    // Get student details for each child
    const childIds = parent.children.map(c => {
      const id = c.studentId || c._id;
      console.log('🔑 Mapping child:', c.name, 'to ID:', id, 'Type:', typeof id);
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (err) {
        console.error('❌ Error converting ID to ObjectId:', id, err.message);
        return null;
      }
    }).filter(id => id !== null);
    
    console.log('📊 Looking up students with IDs:', childIds.map(id => id.toString()));

    const students = await User.find(
      { _id: { $in: childIds } },
      'name email grade createdAt'
    ).lean();
    
    console.log('👶 Students found:', students.length);
    console.log('📝 Student details:', students);

    // Fetch stats for each child
    const childrenWithStats = await Promise.all(
      students.map(async (student) => {
        const studentOid = new mongoose.Types.ObjectId(student._id);
        
        const agg = await Ticket.aggregate([
          { 
            $match: { 
              $or: [
                { createdBy: studentOid }, 
                { student: studentOid }
              ] 
            } 
          },
          { 
            $group: { 
              _id: '$status', 
              count: { $sum: 1 } 
            } 
          }
        ]);

        const stats = { 
          totalTickets: 0, 
          pendingTickets: 0, 
          completedTickets: 0, 
          completionRate: 0 
        };

        agg.forEach(a => {
          const status = a._id;
          const count = a.count || 0;
          stats.totalTickets += count;
          
          if (/waiting|pending/i.test(status)) {
            stats.pendingTickets += count;
          } else if (/completed|done/i.test(status)) {
            stats.completedTickets += count;
          }
        });

        stats.completionRate = stats.totalTickets > 0 
          ? (stats.completedTickets / stats.totalTickets) * 100 
          : 0;

        return {
          ...student,
          stats
        };
      })
    );

    res.json({ 
      status: 'success', 
      data: childrenWithStats 
    });
  } catch (err) {
    next(err);
  }
};

// Get all family tickets
exports.getFamilyTickets = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    const parent = await User.findById(parentId).select('children').lean();
    
    if (!parent || !parent.children || parent.children.length === 0) {
      return res.json({ 
        status: 'success', 
        data: { tickets: [] } 
      });
    }

    const childIds = parent.children.map(c => 
      new mongoose.Types.ObjectId(c.studentId || c._id)
    );

    // Get tickets for all children
    const tickets = await Ticket.find(
      { user: { $in: childIds } }
    )
      .populate('user', 'name email grade')
      .populate('queue', 'name teacher')
      .populate('queue.teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Rename user to student for API response compatibility
    const ticketsWithStudent = tickets.map(ticket => ({
      ...ticket,
      student: ticket.user,
      user: undefined
    }));

    res.json({ 
      status: 'success', 
      data: { tickets: ticketsWithStudent } 
    });
  } catch (err) {
    next(err);
  }
};

// Add child to parent account
exports.addChild = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    console.log('➕ addChild - Parent ID:', parentId);
    
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    const { name, email, grade } = req.body;
    console.log('📝 Adding child:', { name, email, grade });

    if (!name || !email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Name and email are required' 
      });
    }

    // Check if student already exists
    let student = await User.findOne({ email, role: 'student' });
    console.log('🔎 Student lookup:', student ? `Found existing: ${student.name}` : 'No existing student');

    if (!student) {
      // Create new student
      student = new User({
        name,
        email,
        grade: grade || 'Not specified',
        role: 'student',
        password: Math.random().toString(36).slice(-8) // Temporary password
      });
      await student.save();
      console.log('✅ Created new student:', student._id, student.name);
    }

    // Add student to parent's children list if not already there
    const parent = await User.findById(parentId);
    
    if (!parent) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Parent not found' 
      });
    }
    
    console.log('👨 Parent before update:', parent.name, 'Children count:', parent.children?.length || 0);
    
    const childExists = parent.children.some(
      c => c.studentId?.toString() === student._id.toString() || c._id?.toString() === student._id.toString()
    );
    
    console.log('🔄 Child exists:', childExists, 'Student ID:', student._id.toString());

    if (!childExists) {
      const childEntry = {
        name: student.name,
        studentId: student._id.toString(),
        grade: student.grade || 'Not specified'
      };
      console.log('📌 Adding child entry:', JSON.stringify(childEntry));
      parent.children.push(childEntry);
      console.log('📌 Child pushed to parent.children, array is now:', parent.children.map(c => ({ name: c.name, studentId: c.studentId })));
      console.log('💾 Saving parent with children count:', parent.children.length);
      console.log('💾 Parent document before save:', JSON.stringify({ name: parent.name, childrenCount: parent.children.length }));
      
      const saveResult = await parent.save();
      console.log('✅ Parent saved successfully, returned:', saveResult ? 'success' : 'null');
      console.log('✅ Saved parent children count:', saveResult.children.length);
      
      // Verify it was saved
      const verifyParent = await User.findById(parentId);
      console.log('👨 Parent after update (verified):', verifyParent.name, 'Children count:', verifyParent.children.length);
      console.log('👨 Verified children:', verifyParent.children.map(c => ({ name: c.name, studentId: c.studentId })));
    } else {
      console.log('⏭️  Child already exists, skipping add');
    }

    res.status(201).json({ 
      status: 'success', 
      message: 'Child added successfully',
      data: student 
    });
  } catch (err) {
    next(err);
  }
};

// Get details for a specific child
exports.getChildDetails = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    const { childId } = req.params;

    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    if (!childId || !mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid child id' 
      });
    }

    // Verify parent has this child
    const parent = await User.findById(parentId).select('children').lean();
    const hasChild = parent?.children?.some(c => 
      c.studentId?.toString() === childId || c._id?.toString() === childId
    );

    if (!hasChild) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Unauthorized access to this child' 
      });
    }

    // Get child details with stats
    const student = await User.findById(childId, 'name email grade createdAt').lean();
    const studentOid = new mongoose.Types.ObjectId(childId);

    const agg = await Ticket.aggregate([
      { 
        $match: { 
          $or: [
            { createdBy: studentOid }, 
            { student: studentOid }
          ] 
        } 
      },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const stats = { 
      totalTickets: 0, 
      pendingTickets: 0, 
      completedTickets: 0, 
      completionRate: 0 
    };

    agg.forEach(a => {
      const status = a._id;
      const count = a.count || 0;
      stats.totalTickets += count;
      
      if (/waiting|pending/i.test(status)) {
        stats.pendingTickets += count;
      } else if (/completed|done/i.test(status)) {
        stats.completedTickets += count;
      }
    });

    stats.completionRate = stats.totalTickets > 0 
      ? (stats.completedTickets / stats.totalTickets) * 100 
      : 0;

    res.json({ 
      status: 'success', 
      data: {
        ...student,
        stats
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Join queue for a child
exports.joinQueueForChild = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    const { childId, queueId } = req.params;

    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    // Verify parent has this child
    const parent = await User.findById(parentId).select('children').lean();
    const hasChild = parent?.children?.some(c => 
      c.studentId?.toString() === childId || c._id?.toString() === childId
    );

    if (!hasChild) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Unauthorized access to this child' 
      });
    }

    // Verify queue exists
    const queue = await Queue.findById(queueId).lean();
    if (!queue) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Queue not found' 
      });
    }

    // Get the next ticket number for this queue
    const lastTicket = await Ticket.findOne({ queue: queueId })
      .sort({ ticketNumber: -1 })
      .lean();
    const nextTicketNumber = (lastTicket?.ticketNumber || 0) + 1;

    // Count waiting tickets to determine position
    const waitingCount = await Ticket.countDocuments({
      queue: queueId,
      status: 'waiting'
    });
    const nextPosition = waitingCount + 1;

    // Create ticket for child
    const ticket = new Ticket({
      user: new mongoose.Types.ObjectId(childId),
      queue: new mongoose.Types.ObjectId(queueId),
      title: `Help with ${queue.name}`,
      status: 'waiting',
      description: '',
      ticketNumber: nextTicketNumber,
      position: nextPosition
    });

    await ticket.save();

    // Populate references
    await ticket.populate('user', 'name email grade');
    await ticket.populate('queue', 'name teacher');
    await ticket.populate('queue.teacher', 'name email');

    res.status(201).json({ 
      status: 'success', 
      message: 'Successfully joined queue',
      data: ticket 
    });
  } catch (err) {
    next(err);
  }
};

// Get family analytics
exports.getFamilyAnalytics = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or missing parent id' 
      });
    }

    const parent = await User.findById(parentId)
      .select('children name')
      .lean();
    
    if (!parent || !parent.children || parent.children.length === 0) {
      return res.json({ 
        status: 'success', 
        data: { 
          summary: {
            totalChildren: 0,
            pendingFamilyTickets: 0,
            completedFamilyTickets: 0
          },
          childStats: [],
          recentFamilyTickets: []
        } 
      });
    }

    const childIds = parent.children.map(c => 
      new mongoose.Types.ObjectId(c.studentId || c._id)
    );

    // Get all children with their details
    const children = await User.find(
      { _id: { $in: childIds } },
      'name email grade createdAt'
    ).lean();

    // Get all family tickets
    const tickets = await Ticket.find(
      { 
        $or: [
          { createdBy: { $in: childIds } },
          { student: { $in: childIds } }
        ]
      }
    )
      .populate('student', 'name email grade')
      .populate('queue', 'name teacher')
      .populate('queue.teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    let pendingCount = 0;
    let completedCount = 0;

    // Calculate per-child stats
    const childStats = await Promise.all(
      children.map(async (child) => {
        const childOid = new mongoose.Types.ObjectId(child._id);
        
        const agg = await Ticket.aggregate([
          { 
            $match: { 
              $or: [
                { createdBy: childOid }, 
                { student: childOid }
              ] 
            } 
          },
          { 
            $group: { 
              _id: '$status', 
              count: { $sum: 1 } 
            } 
          }
        ]);

        let pending = 0;
        let completed = 0;
        let total = 0;

        agg.forEach(a => {
          const status = a._id;
          const count = a.count || 0;
          total += count;
          
          if (/waiting|pending/i.test(status)) {
            pending += count;
          } else if (/completed|done/i.test(status)) {
            completed += count;
          }
        });

        pendingCount += pending;
        completedCount += completed;

        return {
          childId: child._id,
          childName: child.name,
          totalTickets: total,
          pendingTickets: pending,
          completedTickets: completed,
          completionRate: total > 0 ? (completed / total) * 100 : 0
        };
      })
    );

    res.json({ 
      status: 'success', 
      data: {
        summary: {
          totalChildren: children.length,
          pendingFamilyTickets: pendingCount,
          completedFamilyTickets: completedCount
        },
        childStats,
        recentFamilyTickets: tickets.slice(0, 10)
      }
    });
  } catch (err) {
    next(err);
  }
};
