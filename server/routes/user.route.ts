import express from "express";
import { activateUser, registerUser } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);

export default router;
