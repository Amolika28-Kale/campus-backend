import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Protect Middleware
 * Verifies JWT and attaches minimal safe user info to req.user
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Log incoming header for debugging
    console.log("🛡️ Auth Header:", authHeader ? "Received" : "MISSING");

    // 2. Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    
    // 3. Debug: Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not defined!");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // 4. Decode without verification for debugging
    const decodedWithoutVerify = jwt.decode(token);
    console.log("📦 Token payload (without verify):", decodedWithoutVerify);
    console.log("🔐 Current JWT_SECRET (first 5 chars):", process.env.JWT_SECRET.substring(0, 5) + "...");

    // 5. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified successfully for ID:", decoded.id || decoded._id);
    } catch (jwtError) {
      console.error("🔥 JWT Verification Error:", jwtError.message);
      console.error("Error name:", jwtError.name);
      
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired. Please login again." });
      }
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token signature" });
      }
      return res.status(401).json({ message: "Token verification failed" });
    }

    // 6. Get user ID (handle both 'id' and '_id' fields)
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      console.error("❌ No user ID in token");
      return res.status(401).json({ message: "Invalid token format" });
    }

    // 7. Find user based on role
    let user;
    try {
      if (decoded.role === "admin") {
        user = await Admin.findById(userId).select("-password");
        console.log("👑 Admin found:", user ? "Yes" : "No");
      } else {
        user = await User.findById(userId).select("-password");
        console.log("👤 User found:", user ? "Yes" : "No");
      }
    } catch (dbError) {
      console.error("❌ Database error while finding user:", dbError);
      return res.status(500).json({ message: "Database error" });
    }

    // 8. Check if user exists
    if (!user) {
      console.log("❌ User not found in DB for ID:", userId);
      return res.status(401).json({ message: "User not found" });
    }

    // 9. Check user status (for regular users)
    if (decoded.role !== "admin" && user.status) {
      console.log("📊 User status:", user.status);
      
      if (user.status !== "active") {
        let message = `Account ${user.status}`;
        if (user.status === "pending") message = "Account awaiting approval";
        if (user.status === "banned") message = "Account has been banned";
        if (user.status === "suspended") message = "Account is suspended";
        if (user.status === "rejected") message = "Account registration was rejected";
        
        return res.status(403).json({ message });
      }
    }

    // 10. Attach user to request and continue
    req.user = user;
    console.log("✅ Authentication successful for:", user.email || user.fullName);
    
    next();

  } catch (error) {
    console.error("🔥 Unexpected error in protect middleware:", error);
    return res.status(500).json({ message: "Server error in authentication" });
  }
};

/**
 * Update Last Active Middleware
 * Updates lastActive only for normal users
 */
export const updateLastActive = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "user") {
      // Update without waiting
      User.findByIdAndUpdate(req.user._id, {
        lastActive: Date.now()
      }).catch(err => console.error("Last active update failed:", err));
    }
    next();
  } catch (error) {
    console.error("Error in updateLastActive:", error);
    next(); // Do not block request if update fails
  }
};

// 🔥 Ensure uploads folder exists
const uploadPath = "uploads";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});