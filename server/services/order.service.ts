import { Response, Request, NextFunction } from "express";
import { catchAsync } from "../middleware/catchAsync";
import Order from "../models/order.model";

// create new order
export const createOrder = catchAsync(
 async (data:any, next:NextFunction) => {
    const order = await Order.create(data);

 }
);
