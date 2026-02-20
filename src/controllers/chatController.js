// controllers/chatController.js - Complete Updated Version
import Message from "../models/Message.js";
import Match from "../models/Match.js";

// ✅ Send Message
export const sendMessage = async (req, res) => {
  try {
    const { matchId, content } = req.body;

    if (!matchId || !content)
      return res.status(400).json({ message: "MatchId and content required" });

    const match = await Match.findById(matchId);
    if (!match)
      return res.status(404).json({ message: "Match not found" });

    // ✅ Check user belongs to match
    if (!match.users.some(id => id.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Not allowed" });

    const message = await Message.create({
      matchId,
      sender: req.user._id,
      content
    });

    res.status(201).json(message);

  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get Messages (Filter out deleted ones)
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId);
    if (!match)
      return res.status(404).json({ message: "Match not found" });

    if (!match.users.some(id => id.toString() === userId.toString()))
      return res.status(403).json({ message: "Not allowed" });

    // Get messages where current user is NOT in deletedBy array
    const messages = await Message.find({ 
      matchId,
      deletedBy: { $ne: userId } // Exclude messages deleted by this user
    }).sort({ createdAt: 1 });

    console.log(`📥 Found ${messages.length} messages for user ${userId}`);
    res.json(messages);

  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Mark Messages Seen
export const markAsSeen = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match)
      return res.status(404).json({ message: "Match not found" });

    if (!match.users.some(id => id.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Not allowed" });

    await Message.updateMany(
      { matchId, seen: false, sender: { $ne: req.user._id } },
      { seen: true }
    );

    res.json({ message: "Messages marked as seen" });

  } catch (error) {
    console.error("Seen Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete Message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.query;
    const userId = req.user._id;
    
    console.log("🗑️ Deleting message:", messageId, "forEveryone:", forEveryone);

    // Check if it's a temp ID (from frontend)
    if (messageId.startsWith('temp-')) {
      return res.status(400).json({ 
        message: "Cannot delete temporary message",
        error: "TEMP_ID_NOT_ALLOWED"
      });
    }

    // Validate if it's a valid MongoDB ObjectId
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid message ID format",
        error: "INVALID_ID_FORMAT"
      });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    if (forEveryone === 'true') {
      // Delete for everyone - completely remove message
      await Message.findByIdAndDelete(messageId);
      
      // Emit socket event
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`match:${message.matchId}`).emit('message-deleted', { 
            messageId, 
            forEveryone: true 
          });
        }
      } catch (socketErr) {
        console.log("Socket emission failed:", socketErr);
      }
      
      res.json({ message: "Message deleted for everyone" });
    } else {
      // Delete for me only - add to deletedBy array
      await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deletedBy: userId } } // Add user to deletedBy if not already there
      );
      
      res.json({ message: "Message deleted for you" });
    }
    
  } catch (error) {
    console.error("❌ Delete Message Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid message ID format",
        error: error.message 
      });
    }
    
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Clear Chat (Only for current user)
export const clearChat = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;
    
    console.log(`🗑️ User ${userId} clearing chat for match: ${matchId}`);

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    
    // Check if user belongs to this match
    if (!match.users.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Add current user to deletedBy array for ALL messages in this match
    const result = await Message.updateMany(
      { matchId },
      { $addToSet: { deletedBy: userId } } // Add user to deletedBy for every message
    );
    
    console.log(`✅ Cleared ${result.modifiedCount} messages for user ${userId}`);

    // Emit socket event to notify other user
    try {
      const io = req.app.get('io');
      if (io) {
        // Notify other user in the match
        const otherUser = match.users.find(id => id.toString() !== userId.toString());
        if (otherUser) {
          io.to(`user:${otherUser}`).emit('user-cleared-chat', { 
            matchId,
            userId 
          });
        }
      }
    } catch (socketErr) {
      console.log("Socket emission failed:", socketErr);
    }
    
    res.json({ 
      message: "Chat cleared successfully",
      clearedFor: userId,
      clearedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};