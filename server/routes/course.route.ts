import express from "express";
import {
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
router.get("/:id", getSingleCourse);
export default router;
