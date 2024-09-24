import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const emailRegex: RegExp = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
export interface IUser extends mongoose.Document {
 name: string;
 email: string;
 password: string;
 avatar: {
  public_id: string;
  url: string;
 };
 role: string;
 isVerified: boolean;
 courses: Array<{ courseId: string }>;
 comparePassword: (enteredPassword: string) => Promise<boolean>;
}
const userSchema = new mongoose.Schema<IUser>(
 {
  name: {
   type: String,
   required: [true, "Please enter your name"],
   maxLength: [30, "Your name cannot exceed 30 characters"],
  },
  email: {
   type: String,
   required: [true, "Please enter your email"],
   unique: true,
   validate: {
    validator: function (v: string) {
     return emailRegex.test(v);
    },
    message: (props: any) => `${props.value} is not a valid email`,
   },
  },
  password: {
   type: String,
   required: [true, "Please enter your password"],
   minlength: [6, "Your password must be longer than 6 characters"],
   select: false,
  },
  avatar: {
   public_id: String,
   url: String,
  },
  role: {
   type: String,
   default: "user",
  },
  isVerified: {
   type: Boolean,
   default: false,
  },
  courses: [
   {
    courseId: {
     //  type: mongoose.Schema.Types.ObjectId,
     //  ref: "Course",
     type: String,
    },
   },
  ],
 },
 { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
 if (!this.isModified("password")) {
  next();
 }
 this.password = await bcrypt.hash(this.password, 10);
 next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string) {
 return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
