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


// ✅ Get Messages (ONLY if user part of match)
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
