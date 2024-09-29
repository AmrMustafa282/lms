import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../middleware/catchAsync";
import Order, { IOrder } from "../models/order.model";
import { User } from "../models/user.model";
import Course from "../models/course.model";
import Notification from "../models/notification.model";
import path from "path";
import ejs from "ejs";
import { sendMail } from "../utils/sendMail";
import ErrorHandler from "../utils/ErrorHandler";

// create new order
export const createOrder = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, paymentInfo }: IOrder = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
   return next(new ErrorHandler("User not found", 404));
  }
  const courseExistsInUser = user?.courses.some(
   (c: any) => c._id.toString() === courseId
  );

  if (courseExistsInUser) {
   return next(
    new ErrorHandler("You have already enrolled in this course", 400)
   );
  }

  const course = await Course.findById(courseId);
  if (!course) {
   return next(new ErrorHandler("Course not found", 404));
  }

  const order = await Order.create({
   courseId,
   userId: req.user._id,
   paymentInfo,
  });
  course.purchased ? (course.purchased += 1) : (course.purchased = 1);
  await course.save();
  const mailData = {
   order: {
    _id: course._id,
    name: course.name,
    price: course.price,
    date: new Date().toLocaleDateString("en-US", {
     year: "numeric",
     month: "long",
     day: "numeric",
    }),
   },
  };
  await sendMail({
   email: user.email,
   subject: "Order Confirmation",
   template: "order-confirmation",
   data: mailData,
  });
  user.courses.push(course?._id as any);
  await user.save();
  await Notification.create({
   user: req.user._id,
   title: "New Order",
   message: `You have a new order for ${course.name}`,
  });
  res.status(201).json({
   success: true,
   order,
  });
 }
);
