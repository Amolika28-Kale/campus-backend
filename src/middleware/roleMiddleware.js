/**
 * Admin Authorization Middleware
 * Must be used AFTER protect middleware
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
