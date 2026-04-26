import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import { notifyAdmins } from '../services/notification.service.js';
import { sendChatNotificationEmail } from '../services/emailService.js';

export const setupSocketHandlers = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('anonymousAlias county role isSuspended assignedCounty');
        if (!user) {
          return next(new Error('User not found'));
        }
        socket.user = user;
        next();
      } catch (jwtErr) {
        // Token expired or invalid - allow connection to fail gracefully
        console.warn('JWT verification failed:', jwtErr.message);
        return next(new Error('Invalid or expired token'));
      }
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // Add error handler for authentication failures
  io.on('connection_error', (error) => {
    console.warn('Socket connection error (non-blocking):', error.message);
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.anonymousAlias} connected`);

    // Subscribe user to their own user events for real-time updates
    socket.join(`user:${socket.user._id}`);

    // Send connection confirmation
    socket.emit('connected', { 
      message: 'Connected to server',
      userId: socket.user._id 
    });

    // Join county room
    socket.on('join_county', (county) => {
      try {
        if (socket.user.role === 'countyadmin' && socket.user.assignedCounty !== county) return;
        if (socket.user.role === 'citizen' && socket.user.county !== county) return;
        socket.join(`county:${county}`);
        socket.emit('county_joined', { county });
      } catch (err) {
        socket.emit('error', 'Failed to join county');
      }
    });

    // Join specific chat room
    socket.on('join_room', ({ county, room }) => {
      try {
        if (socket.user.role === 'countyadmin' && socket.user.assignedCounty !== county) return;
        if (socket.user.role === 'citizen' && socket.user.county !== county) return;
        socket.join(`chat:${county}:${room}`);
        socket.emit('room_joined', { county, room });
      } catch (err) {
        socket.emit('error', 'Failed to join room');
      }
    });

    // Send chat message
    socket.on('send_message', async ({ county, room, message, attachments }) => {
      try {
        if (socket.user.isSuspended) {
          socket.emit('error', 'Account suspended');
          return;
        }

        // Validate message
        const trimmedMessage = (message || '').trim();
        const hasAttachments = attachments && attachments.length > 0;
        
        if (!trimmedMessage && !hasAttachments) {
          socket.emit('error', 'Message or attachments required');
          return;
        }

        // Check if user is blocked by checking with super admin
        const superAdmin = await User.findOne({ role: 'superadmin' });
        if (superAdmin && superAdmin.blockedUsers.includes(socket.user._id)) {
          socket.emit('error', 'You have been blocked from posting chats');
          return;
        }

        // County admin can only post to their county
        if (socket.user.role === 'countyadmin' && socket.user.assignedCounty !== county) {
          socket.emit('error', 'Can only post in your assigned county');
          return;
        }

        // Citizens can only post to their county
        if (socket.user.role === 'citizen' && socket.user.county !== county) {
          socket.emit('error', 'County mismatch');
          return;
        }

        const msg = await ChatMessage.create({
          county, 
          room, 
          sender: socket.user._id,
          alias: socket.user.anonymousAlias, 
          message: trimmedMessage || '',
          attachments: attachments || []
        });

        // Ensure message is populated
        await msg.populate('sender', 'anonymousAlias');

        io.to(`chat:${county}:${room}`).emit('new_message', {
          _id: msg._id, 
          county, 
          room,
          alias: msg.alias,
          message: msg.message, 
          attachments: msg.attachments,
          createdAt: msg.createdAt
        });

        // Async: in-app notification + email to county admin (non-blocking)
        setImmediate(async () => {
          try {
            // Only notify for real text messages, not every single chat
            if (!trimmedMessage) return;

            // In-app notification for county admin
            await notifyAdmins(
              'new_chat',
              `New message in ${county} #${room}`,
              `${socket.user.anonymousAlias}: "${trimmedMessage.slice(0, 120)}"`,
              { actionUrl: '/admin/chats', county, room },
              county,
              'normal',
            );

            // Email: county admin only (not citizens — too spammy for chat)
            const countyAdmin = await User.findOne({
              role: 'countyadmin',
              assignedCounty: county,
              isVerifiedCountyAdmin: true,
            }).select('email firstName');

            if (countyAdmin?.email) {
              await sendChatNotificationEmail([countyAdmin.email], {
                county, room,
                alias: socket.user.anonymousAlias,
                message: trimmedMessage,
                recipientName: countyAdmin.firstName,
              });
            }
          } catch (e) {
            console.error('[socketHandlers] Post-message notification error:', e.message);
          }
        });
      } catch (err) {
        socket.emit('error', err.message);
      }
    });

    // Admin: delete message
    socket.on('delete_message', async ({ messageId, county }) => {
      try {
        const msg = await ChatMessage.findById(messageId);
        if (!msg) return;

        const isAdmin = ['countyadmin', 'superadmin'].includes(socket.user.role);
        const isOwner = msg.sender.toString() === socket.user._id.toString();

        // Admin or message owner can delete
        if (!isAdmin && !isOwner) {
          socket.emit('error', 'Not allowed to delete this message');
          return;
        }

        if (socket.user.role === 'countyadmin' && socket.user.assignedCounty !== county) return;

        await ChatMessage.findByIdAndUpdate(messageId, {
          isDeleted: true,
          deletedBy: socket.user._id,
          deletedAt: new Date(),
          message: '[deleted]',
          attachments: []
        });

        // Emit to BOTH rooms so everyone gets the update
        io.to(`chat:${county}:${msg.room}`).emit('message_deleted', { messageId });
        io.to(`county:${county}`).emit('message_deleted', { messageId });

      } catch (err) {
        socket.emit('error', err.message);
      }
    });

    // Payment success event
    socket.on('join_payment_room', (paymentId) => {
      try {
        socket.join(`payment:${paymentId}`);
      } catch (err) {
        socket.emit('error', 'Failed to join payment room');
      }
    });

    // Handle disconnect gracefully
    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.user.anonymousAlias} disconnected (${reason})`);
      // Cleanup happens automatically - socket rooms are cleared
    });

    // Handle manual logout
    socket.on('logout', () => {
      console.log(`🚪 ${socket.user.anonymousAlias} logging out`);
      socket.disconnect();
    });
  });
};
