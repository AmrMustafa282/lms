import { Request, Response, NextFunction } from "express";
import { catchAsync } from "./catchAsync";
import { redis } from "../utils/redis";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";

export const isAuthenticated = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { access_token } = req.cookies;
  if (!access_token) {
   return next(new ErrorHandler("Please login to access this resource", 401));
  }

  const decoded: any = jwt.verify(access_token, process.env.ACCESS_TOKEN || "");

  if (!decoded) {
   return next(new ErrorHandler("Access token is not valid", 401));
  }

  const user = await redis.get(decoded.id);
  if (!user) {
   return next(new ErrorHandler("User not found", 401));
  }
  req.user = JSON.parse(user);
  next();
 }
);

// validate user role
export const authorizeRoles = (...roles: string[]) => {
 return (req: Request, res: Response, next: NextFunction) => {
  if (!roles.includes(req.user?.role || "")) {
   return next(
    new ErrorHandler(
     `Role (${req.user?.role}) is not allowed to access this resource`,
     403
    )
   );
  }
  next();
 };
};
