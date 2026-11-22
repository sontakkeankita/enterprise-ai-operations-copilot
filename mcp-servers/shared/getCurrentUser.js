import mongoose from "mongoose";
import User from "./User.js";

export const getCurrentUser = async () => {
  const userId = process.env.COPILOT_USER_ID;

  if (!userId) {
    throw new Error(
      "Authenticated user context is missing"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid authenticated user ID");
  }

  const user = await User.findById(userId)
    .select("name email role department");

  if (!user) {
    throw new Error("Authenticated employee not found");
  }

  return user;
};