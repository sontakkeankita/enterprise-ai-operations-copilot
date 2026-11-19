
import User from "../models/User.js";

// GET ALL USERS
export const getAllUsers = async (req, res) => {

  try {

    const users = await User.find()
      .select("name email role department createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {

    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users"
    });

  }

};
