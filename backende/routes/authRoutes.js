import express from "express";
import { 
  registerUser,
  verifyOTP, 
  loginUser,
  completeRegistration,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

// Registration Route
router.post("/register", registerUser);


router.post("/verify-otp", verifyOTP);

// Complete Registration Route 
router.post("/complete-registration", completeRegistration);

// Login Route
router.post("/login", loginUser);

// New password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

export default router;
