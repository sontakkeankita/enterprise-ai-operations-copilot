
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

// Generate JWT
const generateToken = (userId) => {

  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

};

// Set JWT inside HTTP-only cookie
const setTokenCookie = (res, token) => {

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  });

};

// Send safe user information
const getSafeUser = (user) => {

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };

};

// REGISTER
export const register = async (req, res) => {

  try {

    const { name, email, password, department } = req.body;

    // Check whether user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create employee account
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      department,
      role: "employee"
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: getSafeUser(user)
    });

  } catch (error) {

    if (error.code === 11000) {

      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });

    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });

  }

};

// LOGIN
export const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    // Find user and explicitly include password hash
    const user = await User.findOne({ email }).select("+password");

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });

    }

    // Compare entered password with stored hash
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {

      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });

    }

    // Generate JWT
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: getSafeUser(user)
    });

  } catch (error) {

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });

  }

};

// LOGOUT
export const logout = (req, res) => {

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful"
  });

};

// GET CURRENT USER
export const getMe = (req, res) => {

  return res.status(200).json({
    success: true,
    user: getSafeUser(req.user)
  });

};
