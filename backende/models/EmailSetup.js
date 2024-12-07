// src/models/EmailSetup.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the schema for the email setup configuration
const emailSetupSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
    SMTP_HOST: { type: String, required: true },
    SMTP_PORT: { type: Number, required: true },
    EMAIL: { type: String, required: true },
    EMAIL_PASSWORD: { type: String, required: true }, // Sensitive data
  },
  { timestamps: true }
);

// Hash the password before saving to store it securely
// emailSetupSchema.pre('save', async function (next) {
//   if (this.isModified('EMAIL_PASSWORD')) {
//     this.EMAIL_PASSWORD = await bcrypt.hash(this.EMAIL_PASSWORD, 10);
//   }
//   next();
// });

// Create the model
const EmailSetup = mongoose.model('EmailSetup', emailSetupSchema);

export default EmailSetup;
