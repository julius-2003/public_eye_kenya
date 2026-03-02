import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

export const setupSocketHandlers = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('anonymousAlias county role isSuspended');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.anonymousAlias} connected`);

    // Join county room
    socket.on('join_county', (county) => {
      if (socket.user.role !== 'superadmin' && socket.user.county !== county) return;
      socket.join(`county:${county}`);
    });

    // Join specific chat room
    socket.on('join_room', ({ county, room }) => {
      if (socket.user.role !== 'superadmin' && socket.user.county !== county) return;
      socket.join(`chat:${county}:${room}`);
    });

    // Send chat message
    socket.on('send_message', async ({ county, room, message }) => {
      if (socket.user.isSuspended) return socket.emit('error', 'Account suspended');
      if (socket.user.county !== county && socket.user.role !== 'superadmin') return;

      const msg = await ChatMessage.create({
        county, room, sender: socket.user._id,
        alias: socket.user.anonymousAlias, message
      });

      io.to(`chat:${county}:${room}`).emit('new_message', {
        _id: msg._id, county, room,
        alias: socket.user.anonymousAlias,
        message: msg.message, createdAt: msg.createdAt
      });
    });

    // Admin: delete message
    socket.on('delete_message', async ({ messageId, county }) => {
      if (!['countyadmin', 'superadmin'].includes(socket.user.role)) return;
      if (socket.user.role === 'countyadmin' && socket.user.assignedCounty !== county) return;
      await ChatMessage.findByIdAndUpdate(messageId, {
        isDeleted: true, deletedBy: socket.user._id, deletedAt: new Date(), message: '[deleted]'
      });
      io.to(`county:${county}`).emit('message_deleted', { messageId });
    });

    // Payment success event
    socket.on('join_payment_room', (paymentId) => {
      socket.join(`payment:${paymentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${socket.user.anonymousAlias} disconnected`);
    });
  });
};
