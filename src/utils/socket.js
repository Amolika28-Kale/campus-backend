// utils/socket.js - Complete Fixed Version
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Match from '../models/Match.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',"http://localhost:5174",
        'https://campus-connectss.netlify.app'
      ],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'], // polling fallback
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('No token'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      console.log('✅ Socket authenticated for user:', socket.userId);
      next();
    } catch (err) {
      console.error('❌ Socket auth error:', err.message);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.userId, 'Socket ID:', socket.id);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Send confirmation
    socket.emit('connected', { userId: socket.userId });

    // Join match room
    socket.on('join-match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`✅ User ${socket.userId} joined match room: ${matchId}`);
      
      // Notify others in the room
      socket.to(`match:${matchId}`).emit('user-online', {
        userId: socket.userId,
        matchId
      });
    });

// utils/socket.js - Add tempId handling
socket.on('send-message', async (data) => {
  try {
    console.log('🎯 Received message on backend:', data);
    
    const { matchId, content, tempId } = data; // tempId घ्या
    
    // Save to database
    const message = await Message.create({
      matchId,
      sender: socket.userId,
      content
    });

    console.log('✅ Message saved to DB. ID:', message._id);

    // Populate sender details
    await message.populate('sender', 'fullName profileImage');

    // Broadcast with tempId so frontend can match
    io.to(`match:${matchId}`).emit('new-message', {
      ...message.toObject(),
      tempId: tempId // Send back tempId
    });
    
  } catch (error) {
    console.error('❌ Socket message error:', error);
  }
});

    // Typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`match:${matchId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Mark messages as seen
    socket.on('mark-seen', async ({ matchId }) => {
      try {
        await Message.updateMany(
          { matchId, sender: { $ne: socket.userId }, seen: false },
          { seen: true }
        );
        
        io.to(`match:${matchId}`).emit('messages-seen', {
          userId: socket.userId,
          matchId
        });
      } catch (error) {
        console.error('Mark seen error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 User disconnected:', socket.userId, 'Reason:', reason);
      
      // Notify all rooms that user is offline
      const rooms = Array.from(socket.rooms).filter(r => r.startsWith('match:'));
      rooms.forEach(room => {
        socket.to(room).emit('user-offline', {
          userId: socket.userId
        });
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};