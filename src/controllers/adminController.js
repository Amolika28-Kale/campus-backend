import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Match from "../models/Match.js";
import Message from "../models/Message.js";
import College from "../models/College.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ================= ADMIN LOGIN ================= */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

res.json({
  message: "Login successful",
  token,
});


  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


/* ================= DASHBOARD ================= */
export const dashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGirls = await User.countDocuments({ gender: "female" });
    const totalBoys = await User.countDocuments({ gender: "male" });

    const pendingApprovals = await User.countDocuments({
      status: "pending",
    });

    const totalMatches = await Match.countDocuments();
    const totalReports = await Report.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUsersToday = await User.countDocuments({
      lastActive: { $gte: today },
    });

    res.json({
      totalUsers,
      totalGirls,
      totalBoys,
      pendingApprovals,
      totalMatches,
      totalReports,
      activeUsersToday,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


/* ================= USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const { college, page = 1, search } = req.query;

    const limit = 20;
    const pageNumber = parseInt(page);
    const skip = (pageNumber - 1) * limit;

    let filter = {};

    if (college) filter.college = college;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .populate("college", "name")
      .select("-password")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const approveUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      status: "active",
    });
    res.json({ message: "User Approved" });
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};

export const rejectUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      status: "rejected",
    });
    res.json({ message: "User Rejected" });
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};

export const banUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      status: "banned",
    });
    res.json({ message: "User Banned" });
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};


/* Soft Delete + Cleanup */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

await Match.deleteMany({ users: userId });


    await Message.deleteMany({ sender: userId });

    await User.findByIdAndUpdate(userId, {
      status: "banned",
    });

    res.json({ message: "User Soft Deleted & Cleaned" });

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};


/* ================= REPORTS ================= */
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "fullName email")
      .populate("reported", "fullName email");

    res.json(reports);

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};


export const takeReportAction = async (req, res) => {
  try {
    const { action } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const user = await User.findById(report.reported);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "warn") {
      user.warningCount = (user.warningCount || 0) + 1;
    }

    if (action === "suspend") {
      user.status = "suspended";
    }

    if (action === "ban") {
      user.status = "banned";
    }

    await user.save();

    report.status = "resolved";
    await report.save();

    res.json({ message: "Action Taken Successfully" });

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};


/* ================= CHAT MONITOR ================= */
export const getSuspiciousChats = async (req, res) => {
  try {
    const keywords = [
      "abuse",
      "money",
      "scam",
      "fake",
      "nude",
      "upi",
      "paytm",
    ];

    const regex = new RegExp(keywords.join("|"), "i");

    const messages = await Message.find({
      content: { $regex: regex },
    }).populate("sender", "fullName email");

    res.json(messages);

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};


/* ================= COLLEGES ================= */
export const addCollege = async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.json({ message: "College Added" });

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getColleges = async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateCollege = async (req, res) => {
  try {
    await College.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "College Updated" });

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteCollege = async (req, res) => {
  try {
    await College.findByIdAndDelete(req.params.id);
    res.json({ message: "College Deleted" });

  } catch {
    res.status(500).json({ message: "Server Error" });
  }
};
