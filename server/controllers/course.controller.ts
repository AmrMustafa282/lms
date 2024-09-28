import { Request, Response, NextFunction } from "express";
import Course from "../models/course.model";

import { catchAsync } from "../middleware/catchAsync";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";

// upload course
export const uploadCourse = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.thumbnail) {
   const result = await cloudinary.v2.uploader.upload(req.body.thumbnail, {
    folder: "course",
   });

   req.body.thumbnail = {
    public_id: result.public_id,
    url: result.secure_url,
   };
  }
  createCourse(req.body, res, next);
 }
);

// update course
export const updateCourse = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.thumbnail) {
   const course = await Course.findById(req.params.id);
   if (course?.thumbnail?.public_id) {
    await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
   }
   const result = await cloudinary.v2.uploader.upload(req.body.thumbnail, {
    folder: "course",
   });
   req.body.thumbnail = {
    public_id: result.public_id,
    url: result.secure_url,
   };
  }
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
   new: true,
   runValidators: true,
   //  useFindAndModify: false,
  });
  res.status(200).json({
   success: true,
   course,
  });
 }
);

// get single course -- without purchasing
export const getSingleCourse = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const isCached = await redis.get(req.params.id);
  let course;
  if (isCached) {
   //  console.log("hitting cache");

   course = JSON.parse(isCached);
  } else {
   //  console.log("hitting db");
   course = await Course.findById(req.params.id).select(
    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
   );
   await redis.set(req.params.id, JSON.stringify(course));
  }
  res.status(200).json({
   success: true,
   course,
  });
 }
);

// get all courses -- without purchasing
export const getAllCourses = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  let courses;
  const areCached = await redis.get("allCourses");
  if (areCached) {
   //  console.log("hitting cache");

   courses = JSON.parse(areCached);
  } else {
   //  console.log("hitting db");

   courses = await Course.find().select(
    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
   );
   await redis.set("allCourses", JSON.stringify(courses));
  }
  res.status(200).json({
   success: true,
   courses,
  });
 }
);

// get course content -- only for valid users
export const getCourseByUser = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const userCourseList = req.user?.courses;
  const courseId = req.params.id;

  const courseExists = userCourseList?.find(
   (c: any) => c._id.toString() === courseId
  );
  if (!courseExists) {
   return next(
    new ErrorHandler("You are not eligible to access this course", 404)
   );
  }
  const course = await Course.findById(courseId);
  const content = course?.courseData;
  res.status(200).json({
   success: true,
   content,
  });
 }
);
