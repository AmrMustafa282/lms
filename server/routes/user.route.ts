import express from "express";
import {
 activateUser,
 getAllUsers,
 getUserInfo,
 loginUser,
 logoutUser,
 registerUser,
 socialAuth,
 updateAccessToken,
 updateAvatar,
 updatePassword,
 updateUserInfo,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);
router.post("/login", loginUser);
router.post("/logout", isAuthenticated, logoutUser);
router.get("/refresh-token", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);
router.post("/social-auth", socialAuth);
router.post("/update-user-info", isAuthenticated, updateUserInfo);
router.patch("/update-password", isAuthenticated, updatePassword);
router.patch("/update-avatar", isAuthenticated, updateAvatar);
router.get("/all", isAuthenticated, authorizeRoles("admin"), getAllUsers);
export default router;
