import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "../middleware/catchAsynct";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { sendMail } from "../utils/sendMail";
require("dotenv").config();

// Register a user => /api/v1/users/register
interface IRegistrationBody {
 name: string;
 email: string;
 password: string;
 avatar?: {
  public_id: string;
  url: string;
 };
}

interface IActivationToken {
 token: string;
 activationCode: string;
}

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
 const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
 const token = jwt.sign(
  { user, activationCode },
  process.env.JWT_SECRET as Secret,
  {
   expiresIn: "10m",
  }
 );
 return { token, activationCode };
};
export const registerUser = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, avatar }: IRegistrationBody = req.body;

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
   return next(new ErrorHandler("Email already exists", 400));
  }

  const user: IRegistrationBody = {
   name,
   email,
   password,
   avatar,
  };
  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;

  const data = { user: { ...user, activationCode } };
  // try {
  await sendMail({
   email: user.email,
   subject: "Acctivate your account",
   template: "activation-mail",
   data,
  });
  res.status(201).json({
   success: true,
   message: "Please check your email to activate your account",
   activationToken: activationToken.token,
  });
  // } catch (error: any) {
  //  return next(new ErrorHandler(error.message, 500));
  // }

  // res.status(201).json({
  //  success: true,
  //  message: "Account Registered Successfully",
  // });
 }
);

// Activate user account => /api/v1/users/activation
interface IActivatioinRequest {
 activation_token: string;
 activation_code: string;
}
export const activateUser = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { activation_token, activation_code }: IActivatioinRequest = req.body;
  const newUesr: { user: IUser; activationCode: string } = jwt.verify(
   activation_token,
   process.env.JWT_SECRET as Secret
  ) as { user: IUser; activationCode: string };
  if (newUesr.activationCode !== activation_code) {
   return next(new ErrorHandler("Invalid activation code", 400));
  }
  const { name, email, password } = newUesr.user;
  const existUser = await User.findOne({ email });
  if (existUser) {
   return next(new ErrorHandler("Email already exists", 400));
  }
  const user = await User.create({
   name,
   email,
   password,
  });
  res.status(201).json({
   success: true,
   message: "Account activated successfully",
   user,
  });
 }
);
