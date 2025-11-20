const Ticket = require('../models/Ticket');

exports.getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user && req.user.userId;
    const tickets = await Ticket.find({ user: userId }).populate('queue').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user && req.user.userId;
    const ticket = await Ticket.findOne({ _id: ticketId, user: userId });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status !== 'waiting') return res.status(400).json({ message: 'Only waiting tickets can be cancelled' });

    ticket.status = 'cancelled';
    await ticket.save();
    res.json({ message: 'Cancelled' });
  } catch (err) { next(err); }
};