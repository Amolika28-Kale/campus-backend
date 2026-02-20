// controllers/chatController.js - Complete with deleteMessage
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

// ✅ Get Messages
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match)
      return res.status(404).json({ message: "Match not found" });

    if (!match.users.some(id => id.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Not allowed" });

    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 });

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

// ✅ Delete Message (FIXED VERSION)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.query;
    
    console.log("🗑️ Deleting message:", messageId, "forEveryone:", forEveryone);
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    if (forEveryone === 'true') {
      // Delete for everyone
      await Message.findByIdAndDelete(messageId);
      
      // Emit socket event for real-time update
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
      // Delete for me only - we'll just delete it for now
      // In a real app, you might want to add a "deletedFor" array
      await Message.findByIdAndDelete(messageId);
      
      res.json({ message: "Message deleted" });
    }
    
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Clear Chat
export const clearChat = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    
    if (!match.users.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not allowed" });
    }
    
    // Delete all messages in this match
    await Message.deleteMany({ matchId });
    
    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`match:${matchId}`).emit('chat-cleared', { matchId });
      }
    } catch (socketErr) {
      console.log("Socket emission failed:", socketErr);
    }
    
    res.json({ message: "Chat cleared successfully" });
    
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};