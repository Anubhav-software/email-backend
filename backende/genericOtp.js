import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { SMTP_HOST, SMTP_PORT, email: EMAIL, EMAIL_PASSWORD } = process.env;

export const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
      user: EMAIL,
      pass: EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // SSL certificate validation hata raha hai
    },
  });

  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: "Your OTP for Vehicle Doc",
    text: `Welcome to Anaya Softwares, This is a OTP mail for Vehicle Doc. Your OTP(ONE TIME PASSWORD) for login is: ${otp} vaild for 5 minutes and please don't share OTP.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};