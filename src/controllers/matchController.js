import Like from "../models/Like.js";
import Match from "../models/Match.js";
import User from "../models/User.js";     // 👈 Missing import
import Block from "../models/Block.js";    // 👈 Missing import

// ✅ Like User
export const likeUser = async (req, res) => {
  try {
    const from = req.user._id;
    const to = req.params.userId;
    
    // Get current user and target user
    const currentUser = await User.findById(from);
    const targetUser = await User.findById(to);

    // Validation checks
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Gender check
    if (currentUser.gender === targetUser.gender) {
      return res.status(400).json({ message: "Invalid like - same gender" });
    }

    // Self-like check
    if (from.toString() === to.toString()) {
      return res.status(400).json({ message: "You cannot like yourself" });
    }

    // Check if already liked
    const existingLike = await Like.findOne({ from, to });
    if (existingLike) {
      return res.json({ message: "Already liked" });
    }

    // Check if already matched
    const existingMatch = await Match.findOne({
      users: { $all: [from, to] }
    });
    if (existingMatch) {
      return res.json(existingMatch);
    }

    // Check if blocked
    const blocked = await Block.findOne({
      $or: [
        { blocker: from, blocked: to },
        { blocker: to, blocked: from }
      ]
    });
    if (blocked) {
      return res.status(403).json({ message: "Cannot like blocked user" });
    }

    // Check for mutual like
    const mutualLike = await Like.findOne({ from: to, to: from });

    if (mutualLike) {
      // Create match
      const match = await Match.create({
        users: [from, to]
      });

      // Optional: Delete the likes after match
      await Like.deleteMany({
        $or: [
          { from, to },
          { from: to, to: from }
        ]
      });

      return res.status(201).json({
        message: "It's a Match!",
        matchId: match._id
      });
    }

    // Create like
    await Like.create({ from, to });

    res.json({ message: "Like Sent" });

  } catch (error) {
    console.error("🔥 Like Error:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// ✅ Get My Matches
export const getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id })
      .populate("users", "fullName email profileImage bio")  // Added more fields
      .sort({ createdAt: -1 });

    res.json(matches);

  } catch (error) {
    console.error("Get Matches Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Unmatch (Secure: Only if user part of match)
export const unmatchUser = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Delete match and related messages
    await Match.findByIdAndDelete(matchId);
    
    // Optional: Also delete messages related to this match
    // await Message.deleteMany({ matchId });

    res.json({ message: "Unmatched successfully" });

  } catch (error) {
    console.error("Unmatch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};