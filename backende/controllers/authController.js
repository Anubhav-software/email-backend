import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';

// Registration Controller
export const registerUser = async (req, res) => {
  const { name, businessName, phoneNumber, email, gstNo, city, state, pincode, password, confirmPassword } = req.body;

  
  if (!name || !businessName || !phoneNumber || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

 
  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits and numeric' });
  }

  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      businessName,
      phoneNumber,
      email,
      gstNo,
      city,
      state,
      pincode,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, phoneNumber: newUser.phoneNumber },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' } 
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { email: newUser.email, phoneNumber: newUser.phoneNumber },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
};
