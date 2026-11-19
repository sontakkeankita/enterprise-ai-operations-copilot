
import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

const createAdmin = async () => {

  try {

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    // Validate environment variables
    if (!name || !email || !password) {
      throw new Error("Admin environment variables are missing");
    }

    if (password.length < 12 || password.length > 72) {
      throw new Error("Admin password must contain 12 to 72 characters");
    }

    // Connect to MongoDB
    await connectDB();

    // Check whether admin already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      if (existingUser.role === "admin") {
        console.log("Admin account already exists");
      } else {
        console.log(
          "This email belongs to an employee. No role was changed."
        );
      }

      return;

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      department: "Administration"
    });

    console.log("Admin account created successfully!");

  } catch (error) {

    console.error("Admin creation failed:", error.message);

    process.exitCode = 1;

  } finally {

    await mongoose.disconnect();

  }

};

createAdmin();
