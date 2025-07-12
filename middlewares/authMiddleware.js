import JWT from "jsonwebtoken";
import userModels from "../models/userModels.js";

export const requiredSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.body.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModels.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking admin status",
    });
  }
};

export const isDoctor = async (req, res, next) => {
  try {
    const user = await userModels.findById(req.user.id);
    if (!user || !user.isDoctor) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking doctor status",
    });
  }
};
