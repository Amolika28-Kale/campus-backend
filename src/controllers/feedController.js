// import User from "../models/User.js";
// import Like from "../models/Like.js";
// import Match from "../models/Match.js";
// import Block from "../models/Block.js";

// export const getFeed = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { campusOnly = "false" } = req.query;

//     const currentUser = await User.findById(userId);

//     // 1. Gender filter (opposite gender)
//     const genderFilter =
//       currentUser.gender === "male"
//         ? { gender: "female" }
//         : { gender: "male" };

//     // 2. Get all blocked users
//     const blocked = await Block.find({
//       $or: [{ blocker: userId }, { blocked: userId }]
//     });

//     const blockedIds = blocked.map(b =>
//       b.blocker.toString() === userId.toString()
//         ? b.blocked
//         : b.blocker
//     );

//     // 3. Get matched users
//     const matches = await Match.find({ users: userId });
//     const matchedIds = matches.flatMap(m => m.users);

//     // 4. Get liked users
//     const liked = await Like.find({ from: userId });
//     const likedIds = liked.map(l => l.to);

//     // 5. Base filter - exclude blocked, matched, liked, and self
//     const baseFilter = {
//       ...genderFilter,
//       status: "active",
//       _id: {
//         $ne: userId,
//         $nin: [...blockedIds, ...matchedIds, ...likedIds]
//       }
//     };

//     let users;

//     if (campusOnly === "true") {
//       // **Same Campus Only** - फक्त same college चे profiles
//       users = await User.find({
//         ...baseFilter,
//         college: currentUser.college
//       })
//         .populate("college", "name")
//         .select("-password");
//     } else {
//       // **All Colleges** - सगळे profiles (same + different)
//       users = await User.find(baseFilter)
//         .populate("college", "name")
//         .select("-password");
      
//       // Optional: Sort by same campus first
//       users.sort((a, b) => {
//         const aSame = a.college?._id.toString() === currentUser.college.toString();
//         const bSame = b.college?._id.toString() === currentUser.college.toString();
        
//         if (aSame && !bSame) return -1;
//         if (!aSame && bSame) return 1;
//         return 0;
//       });
//     }

//     res.json(users);

//   } catch (error) {
//     console.error("Feed Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// controllers/feedController.js - Updated with Profile Photo
// controllers/feedController.js - Complete Fixed Version
import User from "../models/User.js";
import Like from "../models/Like.js";
import Match from "../models/Match.js";
import Block from "../models/Block.js";

export const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { campusOnly = "false" } = req.query;

    console.log("📡 Fetching feed for user:", userId);

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("👤 Current user gender:", currentUser.gender);
    console.log("👤 Current user college:", currentUser.college);

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

    console.log("🚫 Blocked IDs:", blockedIds);
    console.log("💕 Matched IDs:", matchedIds);
    console.log("❤️ Liked IDs:", likedIds);

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
      console.log("🏫 Filtering by same campus:", currentUser.college);
      users = await User.find({
        ...baseFilter,
        college: currentUser.college
      })
        .populate("college", "name city")
        .select("-password -role -status -warningCount -collegeIdImage");
    } else {
      console.log("🌍 Showing all colleges");
      users = await User.find(baseFilter)
        .populate("college", "name city")
        .select("-password -role -status -warningCount -collegeIdImage");
      
      // Sort by same campus first
      users.sort((a, b) => {
        const aSame = a.college?._id.toString() === currentUser.college.toString();
        const bSame = b.college?._id.toString() === currentUser.college.toString();
        
        if (aSame && !bSame) return -1;
        if (!aSame && bSame) return 1;
        return 0;
      });
    }

    console.log(`✅ Found ${users.length} users for feed`);

    // Format response to include all necessary fields
    const formattedUsers = users.map(user => {
      const userObj = user.toObject();
      
      // Calculate age from DOB
      if (userObj.dob) {
        const age = calculateAge(userObj.dob);
        userObj.age = age;
      }

      // Format image URLs if needed
      if (userObj.profileImage) {
        const baseUrl = process.env.BASE_URL || 'https://campus-backend-3axn.onrender.com';
        if (!userObj.profileImage.startsWith('http')) {
          const cleanPath = userObj.profileImage.replace(/\\/g, '/');
          if (cleanPath.includes('uploads/')) {
            const filename = cleanPath.split('uploads/').pop();
            userObj.profileImage = `${baseUrl}/uploads/${filename}`;
          } else {
            userObj.profileImage = `${baseUrl}/uploads/profiles/${cleanPath}`;
          }
        }
      }

      return userObj;
    });

    res.json(formattedUsers);

  } catch (error) {
    console.error("❌ Feed Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper function to calculate age
const calculateAge = (dob) => {
  const diff = new Date() - new Date(dob);
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age;
};