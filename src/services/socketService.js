import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

// Store connected users
const connectedUsers = new Map();

let io;

/**
 * Initialize Socket.io server
 * @param {object} server - HTTP server instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.userId);

      if (!user || user.isBanned) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      connectedAt: new Date(),
    });

    // Update user online status
    User.findByIdAndUpdate(socket.userId, { isOnline: true, lastActive: new Date() });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    // Handle stop typing
    socket.on('stop_typing', ({ conversationId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('user_stop_typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Update user online status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false, 
        lastActive: new Date() 
      });

      // Notify friends about offline status
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });

    // Send online status to connected user
    socket.emit('connected', { userId: socket.userId });
    
    // Broadcast online status
    socket.broadcast.emit('user_online', { userId: socket.userId });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Send message to a user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
export const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Send message to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
export const sendToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 */
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

/**
 * Get all connected users
 */
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

export default {
  initializeSocket,
  getIO,
  sendToUser,
  sendToConversation,
  isUserOnline,
  getConnectedUsers,
};
