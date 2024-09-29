import express from "express";
import { createOrder } from "../controllers/order.controller";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

router.post("/", isAuthenticated, createOrder )


export default router;
