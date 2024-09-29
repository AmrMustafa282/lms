import express from "express";
import {
 getNotifications,
 updateNotificationStatus,
} from "../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.get("/", isAuthenticated, authorizeRoles("admin"), getNotifications);
router.patch(
 "/:id",
 isAuthenticated,
 authorizeRoles("admin"),
 updateNotificationStatus
);

export default router;
