import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsync } from "../middleware/catchAsync";
import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "../utils/sendMail";
import {
 accessTokenOptions,
 refreshTokenOptions,
 sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import cloudinary from "cloudinary";
import { getUserById } from "../services/user.service";
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
  const { name, email, password }: IRegistrationBody = req.body;

  const isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
   return next(new ErrorHandler("Email already exists", 400));
  }

  const user: IRegistrationBody = {
   name,
   email,
   password,
  };
  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;

  const data = { user: { ...user, activationCode } };
  try {
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
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }

  res.status(201).json({
   success: true,
   message: "Account Registered Successfully",
  });
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

// Login user => /api/v1/users/login
interface ILoginRequest {
 email: string;
 password: string;
}
export const loginUser = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { email, password }: ILoginRequest = req.body;
  if (!email || !password) {
   return next(new ErrorHandler("Please enter email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
   return next(new ErrorHandler("User not found", 400));
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
   return next(new ErrorHandler("email or password are incorrect", 400));
  }
  sendToken(user, 200, res);
 }
);

// Logout user => /api/v1/users/logout
export const logoutUser = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  res.cookie("access_token", "", { maxAge: 1 });
  res.cookie("refresh_token", "", { maxAge: 1 });
  redis.del(req.user?._id as string);
  res.status(200).json({
   success: true,
   message: "Logged out successfully",
  });
 }
);

// update access token => /api/v1/users/update-access-token
export const updateAccessToken = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const refresh_token = req.cookies.refresh_token;
  const decoded = jwt.verify(
   refresh_token,
   process.env.REFRESH_TOKEN as Secret
  ) as { id: string };
  if (!decoded) {
   return next(new ErrorHandler("Refresh token is not valid", 400));
  }

  const session = await redis.get(decoded.id);
  if (!session) {
   return next(new ErrorHandler("Please login to access this resource", 400));
  }
  const user = JSON.parse(session);

  const accessToken = jwt.sign(
   { id: user._id },
   process.env.ACCESS_TOKEN as Secret,
   {
    expiresIn: "5m",
   }
  );
  const refreshToken = jwt.sign(
   { id: user._id },
   process.env.REFRESH_TOKEN as Secret,
   {
    expiresIn: "30d",
   }
  );
  req.user = user;
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(200).json({
   success: true,
   accessToken,
   refreshToken,
  });
 }
);

// Get user info => /api/v1/users/me
export const getUserInfo = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  getUserById((req.user?._id as string) || "", res);
 }
);

// social auth => /api/v1/users/social-auth
interface ISocialAuthRequest {
 email: string;
 name: string;
 avatar: string;
}
export const socialAuth = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  let user;
  const { email, name, avatar }: ISocialAuthRequest = req.body;
  user = await User.findOne({ email });
  if (!user) {
   user = await User.create({
    name,
    email,
    avatar,
    password: crypto.randomBytes(20).toString("hex"),
   });
  }
  sendToken(user as IUser, 200, res);
 }
);

// update user info => /api/v1/users/update-info
interface IUpdateUserInfoRequest {
 name: string;
 email: string;
 avatar: string;
}
export const updateUserInfo = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, avatar }: IUpdateUserInfoRequest = req.body;
  const user = await User.findOne({ _id: req.user?._id });
  if (!user) {
   return next(new ErrorHandler("User not found", 400));
  }
  if (email) {
   const isEmailExist = await User.findOne({ email });
   if (isEmailExist) {
    return next(new ErrorHandler("Email already exists", 400));
   }
   user.email = email;
  }
  // user.avatar = avatar;
  if (name) {
   user.name = name;
  }
  await user.save();
  await redis.set(user._id as string, JSON.stringify(user));
  res.status(200).json({
   success: true,
   message: "User updated successfully",
   user,
  });
 }
);

// update user password => /api/v1/users/update-password
interface IUpdatePasswordRequest {
 oldPassword: string;
 newPassword: string;
}
export const updatePassword = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword }: IUpdatePasswordRequest = req.body;
  if (!oldPassword || !newPassword) {
   return next(new ErrorHandler("Please enter old and new password", 400));
  }
  const user = await User.findOne({ _id: req.user?._id }).select("+password");
  if (!user) {
   return next(new ErrorHandler("User not found", 400));
  }
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
   return next(new ErrorHandler("current password is incorrect", 400));
  }
  user.password = newPassword;
  await user.save();
  await redis.set(user._id as string, JSON.stringify(user));
  res.status(201).json({
   success: true,
   message: "Password updated successfully",
  });
 }
);

// update prifile avatar => /api/v1/users/update-avatar
interface IUpdateAvatarRequest {
 avatar: string;
}
export const updateAvatar = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const { avatar }: IUpdateAvatarRequest = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
   return next(new ErrorHandler("User not found", 400));
  }
  if (!avatar) {
   return next(new ErrorHandler("Please enter avatar", 400));
  }
  if (user?.avatar?.public_id) {
   await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  const result = await cloudinary.v2.uploader.upload(avatar, {
   folder: "avatars",
   width: "150",
   height: "150",
   crop: "fill",
  });
  user.avatar = {
   public_id: result.public_id,
   url: result.secure_url,
  };
  await user.save();
  await redis.set(user._id as string, JSON.stringify(user));
  res.status(200).json({
   success: true,
   message: "Avatar updated successfully",
   user,
  });
 }
);

// get all users -- only for admins
export const getAllUsers = catchAsync(
 async (req: Request, res: Response, next: NextFunction) => {
  const users = await User.find().sort("-createdAt");
  res.status(200).json({
   success: true,
   users,
  });
 }
);
