import express from "express";
import {
 addAnswer,
 addQuestion,
 getAllCourses,
 getCourseByUser,
 getSingleCourse,
 updateCourse,
 uploadCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.post("/create", isAuthenticated, authorizeRoles("admin"), uploadCourse);
router.patch(
 "/update/:id",
 isAuthenticated,
 authorizeRoles("admin"),
 updateCourse
);
router.get("/", getAllCourses);
router.get("/content/:id", isAuthenticated, getCourseByUser);
router.patch("/add-question", isAuthenticated, addQuestion);
router.patch("/add-answer", isAuthenticated, addAnswer);
router.get("/:id", getSingleCourse);
export default router;
