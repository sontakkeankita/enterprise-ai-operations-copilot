
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {

  try {

    // Get token from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {

      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login."
      });

    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find the current user in MongoDB
    const user = await User.findById(decoded.sub);

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });

    }

    // Attach user information to request
    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });

  }

};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {

  return (req, res, next) => {

    if (!req.user) {

      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });

    }

    if (!allowedRoles.includes(req.user.role)) {

      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource"
      });

    }

    next();

  };

};

export { protect, authorizeRoles };
