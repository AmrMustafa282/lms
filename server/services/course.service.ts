import { Response, Request, NextFunction } from "express";
import Course from "../models/course.model";
import { catchAsync } from "../middleware/catchAsync";

// create course
export const createCourse = catchAsync(async (data: any, res: Response) => {
 const course = await Course.create(data);
 res.status(201).json({
  success: true,
  course,
 });
});
