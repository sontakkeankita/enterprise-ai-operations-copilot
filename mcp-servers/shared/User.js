import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
    },
    department: String,
  },
  {
    collection: "users",
    timestamps: true,
  }
);

const User =
  mongoose.models.McpUser ||
  mongoose.model("McpUser", userSchema);

export default User;