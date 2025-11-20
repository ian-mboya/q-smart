const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user && (req.user.id || req.user.userId);
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing teacher id' });
    }

    const queues = await Queue.find({ admin: teacherId }).select('_id name').lean();
    const queueIds = queues.map(q => q._id);

    const agg = await Ticket.aggregate([
      { $match: { queue: { $in: queueIds } } },
      { $group: { _id: { queue: '$queue', status: '$status' }, count: { $sum: 1 } } }
    ]);

    const statsByQueue = {};
    queues.forEach(q => { statsByQueue[q._id.toString()] = { name: q.name, pending: 0, inProgress: 0, completed: 0, total: 0 }; });

    agg.forEach(a => {
      const qid = a._id.queue.toString();
      const status = a._id.status;
      const count = a.count || 0;
      if (!statsByQueue[qid]) statsByQueue[qid] = { name: qid, pending:0, inProgress:0, completed:0, total:0 };
      if (status === 'waiting') statsByQueue[qid].pending = count;
      else if (['called','in-progress','in_progress'].includes(status)) statsByQueue[qid].inProgress = count;
      else if (['completed','done'].includes(status)) statsByQueue[qid].completed = count;
      statsByQueue[qid].total += count;
    });

    const summary = {
      totalQueues: queues.length,
      pendingTickets: Object.values(statsByQueue).reduce((s,v) => s + (v.pending||0), 0),
      completedTickets: Object.values(statsByQueue).reduce((s,v) => s + (v.completed||0), 0),
    };

    return res.json({ status: 'success', data: { analytics: { summary, perQueue: statsByQueue } } });
  } catch (err) {
    next(err);
  }
};

// get analytics for the logged-in student
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user && (req.user.id || req.user.userId);
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing student id' });
    }

    // use `new` when constructing ObjectId
    const studentOid = new mongoose.Types.ObjectId(studentId);

    const agg = await Ticket.aggregate([
      { $match: { $or: [{ createdBy: studentOid }, { student: studentOid }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const summary = { pending: 0, inProgress: 0, completed: 0, total: 0 };
    agg.forEach(a => {
      const status = a._id;
      const count = a.count || 0;
      if (/waiting|pending/i.test(status)) summary.pending += count;
      else if (/in[-_ ]?progress|called/i.test(status)) summary.inProgress += count;
      else if (/completed|done/i.test(status)) summary.completed += count;
      summary.total += count;
    });

    return res.json({ status: 'success', data: { analytics: { summary } } });
  } catch (err) {
    next(err);
  }
};

// get analytics for a parent's children
exports.getParentAnalytics = async (req, res, next) => {
  try {
    const parentId = req.user && (req.user.id || req.user.userId);
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing parent id' });
    }

    const parent = await User.findById(parentId).select('children').lean();
    const children = (parent && Array.isArray(parent.children) && parent.children.length) ? parent.children : [];

    if (children.length === 0) {
      return res.json({ status: 'success', data: { analytics: { summary: { pending:0, inProgress:0, completed:0, total:0 } } } });
    }

    // construct ObjectId array with `new`
    const childObjectIds = children.map(c => new mongoose.Types.ObjectId(c));

    const agg = await Ticket.aggregate([
      { $match: { $or: [{ createdBy: { $in: childObjectIds } }, { student: { $in: childObjectIds } }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const summary = { pending: 0, inProgress: 0, completed: 0, total: 0 };
    agg.forEach(a => {
      const status = a._id;
      const count = a.count || 0;
      if (/waiting|pending/i.test(status)) summary.pending += count;
      else if (/in[-_ ]?progress|called/i.test(status)) summary.inProgress += count;
      else if (/completed|done/i.test(status)) summary.completed += count;
      summary.total += count;
    });

    return res.json({ status: 'success', data: { analytics: { summary } } });
  } catch (err) {
    next(err);
  }
};