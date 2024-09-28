import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";

export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN }));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);

app.get("/", (req: Request, res: Response) => {
 res.status(200).json({
  success: true,
  message: "API is working",
 });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
 const error = new Error(`Route not found - ${req.originalUrl}`) as any;
 error.statusCode = 404;
 next(error);
});

app.use(ErrorMiddleware);
