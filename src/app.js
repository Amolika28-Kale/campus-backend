import dotenv from "dotenv";
dotenv.config(); // This MUST be at the VERY TOP of your file

console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET); // Should print "true"
console.log("🚀 Server starting...");

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken"; 
import connectDB from "./config/db.js";

// Routes Imports
import authRoutes from "./routes/authRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Import socket functions
import { initializeSocket } from "./utils/socket.js";

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173","http://localhost:5174","https://campus-connectss.netlify.app"],
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Create HTTP server
const server = http.createServer(app);

// ✅ FIX: Initialize Socket.io properly
const io = initializeSocket(server);

// Optional: You can also access io globally if needed
app.set('io', io);

// Test Auth Endpoint
app.get("/api/test-auth", (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET missing" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "Token valid", decoded });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

// Start server
// server.js - Add this after server.listen
server.listen(process.env.PORT || 5000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 5000} 🚀`);
  console.log(`📡 API: http://localhost:${process.env.PORT || 5000}/api`);
  console.log(`🔌 Socket.io ready on port ${process.env.PORT || 5000}`);
  console.log(`🔌 Socket.io path: /socket.io/`);
});

// Add a test endpoint for socket
app.get('/api/socket-test', (req, res) => {
  res.json({ 
    message: 'Socket server is running',
    connections: io?.engine?.clientsCount || 0
  });
});
// server.js मध्ये हे add करा
app.get('/api/socket-status', (req, res) => {
  const io = req.app.get('io');
  res.json({
    status: 'ok',
    connections: io?.engine?.clientsCount || 0,
    sockets: Array.from(io?.sockets?.sockets?.keys() || [])
  });
});