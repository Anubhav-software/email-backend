import { sendOTP } from "../genericOtp.js";
import crypto from "crypto";
import  User from "../models/userModel.js"; 
import OTPModel from '../models/otpModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const { name, email, phoneNumber } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !phoneNumber) {
    return res.status(400).json({ message: "Name, Email, and Phone number are required" });
  }

  // Generate OTP for email verification
  const otp = crypto.randomInt(100000, 999999).toString();
  
  try {
    // Store OTP in MongoDB with expiration
    const otpDoc = await OTPModel.create({
      email,
      name,
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });
    
    // Send OTP via email
    await sendOTP(email, otp);
    
    // Enhanced debug logging
    console.log('OTP stored and sent:', { 
      email: otpDoc.email,
      name: otpDoc.name,
      phoneNumber: otpDoc.phoneNumber,
      otp: otpDoc.otp 
    });
    
    return res.status(200).json({ message: "OTP sent to your email. Please verify." });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({ message: "Error sending OTP", error });
  }
};

export const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    const otpDoc = await OTPModel.findOne({
      otp,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpDoc) {
      return res.status(404).json({ message: "Invalid OTP or OTP expired" });
    }

    const { email, name, phoneNumber } = otpDoc;

    // Generate token with user data
    const token = jwt.sign(
      { email, name, phoneNumber },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Delete the OTP document
    await OTPModel.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({ 
      message: "OTP verified successfully.", 
      token,
      userData: {
        email,
        name,
        phoneNumber
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: "Error verifying OTP", error });
  }
};

export const completeRegistration = async (req, res) => {
  const { 
    businessName, 
    gstNo, 
    city, 
    state, 
    pincode,
    password, 
    confirmPassword 
  } = req.body;

  // Get token from headers
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { email, name, phoneNumber } = decoded;

    // Check if all fields are provided
    if (!businessName || !gstNo || !city || !state || !pincode || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ 
        message: "Invalid pincode format. Must be 6 digits" 
      });
    }

    // Check password length
    if (password.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: "Passwords do not match" 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: "User already exists" 
      });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      name,
      phoneNumber,
      businessName,
      gstNo,
      city,
      state,
      pincode,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({ 
      message: "User registered successfully!" 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: "Error registering user", 
      error: error.message 
    });
  }
};

// Login Controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' } 
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP in MongoDB
    await OTPModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
    
    // Send OTP via email
    await sendOTP(email, otp);
    
    console.log('Password reset OTP sent:', { email, otp });
    
    return res.status(200).json({ 
      message: "Password reset OTP sent to your email" 
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ 
      message: "Error sending reset OTP", 
      error: error.message 
    });
  }
};

export const verifyResetOTP = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    const otpDoc = await OTPModel.findOne({
      otp,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpDoc) {
      return res.status(404).json({ message: "Invalid OTP or OTP expired" });
    }

    const { email } = otpDoc;

    // Generate reset token
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' }
    );

    // Delete the OTP document
    await OTPModel.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({ 
      message: "OTP verified successfully.", 
      resetToken
    });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    return res.status(500).json({ 
      message: "Error verifying OTP", 
      error: error.message 
    });
  }
};

export const resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Reset token is required" });
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { email } = decoded;

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: "Passwords do not match" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ 
      message: "Password reset successful" 
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Reset token expired" });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      message: "Error resetting password", 
      error: error.message 
    });
  }
};