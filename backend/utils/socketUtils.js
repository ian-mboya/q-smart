const socketIO = require('socket.io');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // User joins their personal room for notifications
      socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        this.connectedUsers.set(userId, socket.id);
        console.log(`👤 User ${userId} joined their room`);
      });

      // User joins queue room for live updates
      socket.on('join-queue', (queueId) => {
        socket.join(`queue-${queueId}`);
        console.log(`📊 User joined queue room: ${queueId}`);
      });

      // Manager joins queue management room
      socket.on('join-queue-management', (queueId) => {
        socket.join(`manage-queue-${queueId}`);
        console.log(`👨‍💼 Manager joined queue management: ${queueId}`);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        
        // Remove from connected users
        for (let [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
      });
    });

    return this.io;
  }

  // Notify user about their ticket
  notifyUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit(event, data);
      console.log(`📢 Notified user ${userId}: ${event}`);
    }
  }

  // Notify all users in a queue
  notifyQueue(queueId, event, data) {
    if (this.io) {
      this.io.to(`queue-${queueId}`).emit(event, data);
      console.log(`📢 Notified queue ${queueId}: ${event}`);
    }
  }

  // Notify queue managers
  notifyQueueManagers(queueId, event, data) {
    if (this.io) {
      this.io.to(`manage-queue-${queueId}`).emit(event, data);
      console.log(`📢 Notified queue managers ${queueId}: ${event}`);
    }
  }

  // Get socket instance
  getIO() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }
}

module.exports = new SocketManager();