import express from "express";
import {
 activateUser,
 loginUser,
 logoutUser,
 registerUser,
} from "../controllers/user.controller";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;
