import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
require("dotenv").config();

interface EmailOptions {
 email: string;
 subject: string;
 template: string;
 data: { [key: string]: any };
}

export const sendMail = async ({
 email,
 subject,
 template,
 data,
}: EmailOptions) => {
 const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  service: process.env.SMTP_SERVICE,
  secure: false,
  auth: {
   user: process.env.SMTP_USER,
   pass: process.env.SMTP_PASSWORD,
  },
 });

 const message = {
  from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
  to: email,
  subject,
  html: await ejs.renderFile(
   path.join(__dirname, `../mails/${template}.ejs`),
   data
  ),
 };

 await transporter.sendMail(message);
};
