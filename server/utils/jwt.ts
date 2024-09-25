require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
 expires: Date;
 maxAge: number;
 httpOnly: boolean;
 sameSite: "lax" | "strict" | "none" | "strict" | undefined;
 secure?: boolean;
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
 const token = user.SignAccessToken();
 const refreshToken = user.SignRefreshToken();

 // upload refresh token in redis
 redis.set(user._id as any, JSON.stringify(user) as any);

 // parse env variables to integrate with fallback values
 const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
 );
 const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
 );

 const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 1000),
  maxAge: accessTokenExpire * 1000,
  httpOnly: true,
  sameSite: "lax",
  // secure: true,
 };

 const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 1000),
  maxAge: refreshTokenExpire * 1000,
  httpOnly: true,
  sameSite: "lax",
  // secure: true,
 };

 // only set secure to true in production
 if (process.env.NODE_ENV === "production") {
  accessTokenOptions.secure = true;
  refreshTokenOptions.secure = true;
 }

 res.cookie("access_token", token, accessTokenOptions);
 res.cookie("refresh_token", refreshToken, refreshTokenOptions);
 res.status(statusCode).json({
  success: true,
  user,
  token,
  refreshToken,
 });
};
