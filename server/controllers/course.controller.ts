import { Request, Response, NextFunction } from "express";
import Course from "../models/course.model";
import Notification from "../models/notification.model";
import { catchAsync } from "../middleware/catchAsync";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import { sendMail } from "../utils/sendMail";

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

// add question to course
interface IAddQuestionData {
 question: string;
 courseId: string;
 contentId: string;
}
export const addQuestion = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { question, courseId, contentId }: IAddQuestionData = req.body;
  if (!question || !courseId || !contentId) {
   return next(new ErrorHandler("Please enter all fields", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(contentId)) {
   return next(new ErrorHandler("Invalid content id", 400));
  }

  const course = await Course.findById(courseId);
  if (!course) {
   return next(new ErrorHandler("Course not found", 404));
  }
  const content = course.courseData.find(
   (c: any) => c._id.toString() === contentId
  );
  if (!content) {
   return next(new ErrorHandler("Content not found", 404));
  }

  const newQuestion: any = {
   user: req.user,
   question,
   questionReplies: [],
  };

  content.questions.push(newQuestion);
  await Notification.create({
   user: req.user._id,
   title: "New Question",
   message: `You have a new question for ${content.title}`,
  });
  await course.save();
  res.status(201).json({
   success: true,
   course,
  });
 }
);

// add answer to question
interface IAddAnswerData {
 answer: string;
 courseId: string;
 contentId: string;
 questionId: string;
}
export const addAnswer = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
  if (!answer || !courseId || !contentId || !questionId) {
   return next(new ErrorHandler("Please enter all fields", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
   return next(new ErrorHandler("Invalid content id", 400));
  }
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
   return next(new ErrorHandler("Invalid question id", 400));
  }

  const course = await Course.findById(courseId);
  if (!course) {
   return next(new ErrorHandler("Course not found", 404));
  }
  const content = course.courseData?.find(
   (c: any) => c._id.toString() === contentId
  );
  if (!content) {
   return next(new ErrorHandler("Content not found", 404));
  }

  const question = content?.questions?.find(
   (q: any) => q._id.toString() === questionId
  );
  if (!question) {
   return next(new ErrorHandler("Question not found", 404));
  }

  const newAnswer: any = {
   user: req.user,
   answer,
  };

  question.questionReplies?.push(newAnswer);
  await course.save();
  console.log(question);

  if (req.user?._id === question.user._id) {
   await Notification.create({
    user: req.user._id,
    title: "New Question Reply",
    message: `You have a new question reply for ${content.title}`,
   });
  } else {
   // send an email to the user
   const data = {
    name: question.user.name,
    title: content.title,
   };
   await sendMail({
    email: question.user.email,
    subject: "Question Reply",
    template: "question-reply",
    data,
   });
  }
  res.status(201).json({
   success: true,
   course,
  });
 }
);

// add review to course
interface IAddReviewData {
 review: string;
 courseId: string;
 rating: number;
 userId: string;
}
export const addReview = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const userCourseList = req.user?.courses;
  const courseId = req.params.id;
  const courseExists = userCourseList?.find(
   (c: any) => c._id.toString() === courseId
  );
  if (!courseExists) {
   return next(
    new ErrorHandler("You are not eligible to review this course", 404)
   );
  }

  const course = await Course.findById(courseId);
  if (!course) {
   return next(new ErrorHandler("Course not found", 404));
  }
  const { review, rating }: IAddReviewData = req.body;
  const reviewData: any = {
   user: req.user,
   comment: review,
   rating,
  };

  course.reviews.push(reviewData);
  let avg = 0;
  course.reviews.forEach((r: any) => {
   avg += r.rating;
  });
  course.ratings = avg / course.reviews.length;
  await course.save();
  const notification = {
   title: "New Review Received",
   message: `${req.user?.name} has given a review on ${course.name}`,
  };
  // create a notification
  res.status(200).json({
   success: true,
   course,
  });
 }
);

// add reply to review
interface IAddReplyData {
 comment: string;
 reviewId: string;
 courseId: string;
}
export const addReplyToReview = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { comment, reviewId, courseId }: IAddReplyData = req.body;
  if (!comment || !reviewId || !courseId) {
   return next(new ErrorHandler("Please enter all fields", 400));
  }
  const course = await Course.findById(courseId);
  if (!course) {
   return next(new ErrorHandler("Course not found", 404));
  }

  const review = course.reviews.find((r: any) => r._id.toString() === reviewId);
  if (!review) {
   return next(new ErrorHandler("Review not found", 404));
  }

  const newReply: any = {
   user: req.user,
   comment,
  };

  if (!review.commentReplies) {
   review.commentReplies = [];
  }
  review.commentReplies?.push(newReply);

  await course.save();
  res.status(201).json({
   success: true,
   course,
  });
 }
);

// get all courses -- only for admin
export const getAllCoursesAdmin = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const courses = await Course.find().sort("-createdAt");
  res.status(200).json({
   success: true,
   courses,
  });
 }
);
