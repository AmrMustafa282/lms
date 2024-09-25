import { Response } from "express";
import { User } from "../models/user.model";

// get user by id => /api/v1/users/:id
export const getUserById = async (id: string, res: Response) => {
 const user = await User.findById(id);
 if (!user) {
  throw new Error("User not found");
 }
 res.status(200).json({
  success: true,
  user,
 });
};
