import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, },
    phoneNumber: { type: String, },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, default: function() {
        return new Date(Date.now() + 5 * 60 * 1000); 
    } },
    createdAt: { type: Date, default: Date.now, expires: 300 }
}, { timestamps: true });

const OTPModel = mongoose.model('OTP', otpSchema);

export default OTPModel;
