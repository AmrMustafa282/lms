import Notification from "../models/notification.model";
import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middleware/catchAsync";

// get all notifications -- only for admin
export const getNotifications = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const notifications = await Notification.find().sort("-createdAt");
  res.status(200).json({
   success: true,
   notifications,
  });
 }
);

// update notification status -- only for admin
export const updateNotificationStatus = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const notification = await Notification.findByIdAndUpdate(
   req.params.id,
   { status: "read" },
   { new: true }
  );
  const notifications = await Notification.find().sort("-createdAt");
  res.status(200).json({
   success: true,
   notifications,
  });
 }
);
