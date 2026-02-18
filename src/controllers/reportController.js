import Report from "../models/Report.js";

export const reportUser = async (req, res) => {
  try {
    const { reportedId, reason } = req.body;

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export default { reportUser };