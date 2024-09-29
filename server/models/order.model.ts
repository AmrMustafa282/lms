import mongoose from "mongoose";

export interface IOrder extends mongoose.Document {
 courseId: string;
 userId: string;
 paymentInfo: object;
}
const orderSchema = new mongoose.Schema<IOrder>(
 {
  courseId: { type: String, required: true },
  userId: { type: String, required: true },
  paymentInfo: { type: Object },
 },
 {
  timestamps: true,
 }
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
