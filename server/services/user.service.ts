import { Response } from "express";
import { User } from "../models/user.model";
import { redis } from "../utils/redis";

// get user by id => /api/v1/users/:id
export const getUserById = async (id: string, res: Response) => {
 const userJson = await redis.get(id);
 if (!userJson) {
  throw new Error("User not found");
 }
 const user = JSON.parse(userJson as string);
 res.status(200).json({
  success: true,
  user,
 });
};

// get all users
const getAllUsers = async (res: Response) => {
 const users = await User.find().sort("-createdAt");

 res.status(200).json({
  success: true,
  users,
 });
};
