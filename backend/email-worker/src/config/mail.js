
import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export async function verifyMailConnection() {
  await transporter.verify();
  console.log("✅ Gmail SMTP connection successful!");
}

export default transporter;
