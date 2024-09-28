import mongoose, { mongo } from "mongoose";

interface IComment extends mongoose.Document {
 user: object;
 comment: string;
 commentReplies?: IComment[];
}

interface IReview extends mongoose.Document {
 user: object;
 rating: number;
 comment: string;
 commentReplies: IComment[];
}
interface ILink extends mongoose.Document {
 title: string;
 url: string;
}
interface ICourseData extends mongoose.Document {
 title: string;
 description: string;
 videoUrl: string;
 videoThumbnail: object;
 videoSection: string;
 videoDuration: number;
 videoPlayer: string;
 links: ILink[];
 suggestion: string;
 questions: IComment[];
}
interface ICourse extends mongoose.Document {
 name: string;
 description: string;
 price: number;
 estimatedPrice: number;
 thumbnail: {
  public_id: string;
  url: string;
 };
 tags: string;
 level: string;
 demoUrl: string;
 benefits: { title: string }[];
 prerequisites: { title: string }[];
 reviews: IReview[];
 courseData: ICourseData[];
 ratings?: number;
 purchased?: number;
}

const reviewSchema = new mongoose.Schema<IReview>(
 {
  user: {
   type: Object,
   //  type: mongoose.Schema.Types.ObjectId,
   //  ref: "User",
  },
  rating: {
   type: Number,
   default: 0,
  },
  comment: {
   type: String,
  },
 },
 { timestamps: true }
);

const linkSchema = new mongoose.Schema<ILink>(
 {
  title: String,
  url: String,
 },
 { timestamps: true }
);

const commentSchema = new mongoose.Schema<IComment>(
 {
  user: Object,
  comment: String,
  commentReplies: [Object],
 },
 { timestamps: true }
);

const courseDataSchema = new mongoose.Schema<ICourseData>(
 {
  videoUrl: String,
  title: String,
  description: String,
  videoSection: String,
  videoDuration: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
 },
 { timestamps: true }
);

const courseSchema = new mongoose.Schema<ICourse>(
 {
  name: {
   type: String,
   required: [true, "Please enter course name"],
  },
  description: {
   type: String,
   required: [true, "Please enter course description"],
  },
  price: {
   type: Number,
   required: [true, "Please enter course price"],
  },
  estimatedPrice: {
   type: Number,
  },
  thumbnail: {
   public_id: {
    type: String,
   },
   url: {
    type: String,
   },
  },
  tags: {
   type: String,
   required: [true, "Please enter course tags"],
  },
  level: {
   type: String,
   required: [true, "Please enter course level"],
  },
  demoUrl: {
   type: String,
   required: [true, "Please enter course demo url"],
  },
  benefits: [{ title: String }],
  prerequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: { type: Number, default: 0 },
  purchased: { type: Number, default: 0 },
 },
 { timestamps: true }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);
export default Course;
