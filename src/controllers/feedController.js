import User from "../models/User.js";
import Like from "../models/Like.js";
import Match from "../models/Match.js";
import Block from "../models/Block.js";

export const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { campusOnly = "false" } = req.query;

    const currentUser = await User.findById(userId);

    // 1. Gender filter (opposite gender)
    const genderFilter =
      currentUser.gender === "male"
        ? { gender: "female" }
        : { gender: "male" };

    // 2. Get all blocked users
    const blocked = await Block.find({
      $or: [{ blocker: userId }, { blocked: userId }]
    });

    const blockedIds = blocked.map(b =>
      b.blocker.toString() === userId.toString()
        ? b.blocked
        : b.blocker
    );

    // 3. Get matched users
    const matches = await Match.find({ users: userId });
    const matchedIds = matches.flatMap(m => m.users);

    // 4. Get liked users
    const liked = await Like.find({ from: userId });
    const likedIds = liked.map(l => l.to);

    // 5. Base filter - exclude blocked, matched, liked, and self
    const baseFilter = {
      ...genderFilter,
      status: "active",
      _id: {
        $ne: userId,
        $nin: [...blockedIds, ...matchedIds, ...likedIds]
      }
    };

    let users;

    if (campusOnly === "true") {
      // **Same Campus Only** - फक्त same college चे profiles
      users = await User.find({
        ...baseFilter,
        college: currentUser.college
      })
        .populate("college", "name")
        .select("-password");
    } else {
      // **All Colleges** - सगळे profiles (same + different)
      users = await User.find(baseFilter)
        .populate("college", "name")
        .select("-password");
      
      // Optional: Sort by same campus first
      users.sort((a, b) => {
        const aSame = a.college?._id.toString() === currentUser.college.toString();
        const bSame = b.college?._id.toString() === currentUser.college.toString();
        
        if (aSame && !bSame) return -1;
        if (!aSame && bSame) return 1;
        return 0;
      });
    }

    res.json(users);

  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};