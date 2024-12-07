import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js'; 

// Load environment variables from .env file
dotenv.config();

const app = express();

// Add CORS middleware before other middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Use the auth routes
app.use('/api/auth', authRoutes);

// Use the email routes (Setup Email)
app.use('/api/email', emailRoutes);

// Use the section routes (for managing content sections)
app.use('/api/sections', sectionRoutes);

// Start the server
const PORT = process.env.PORT || 9090;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
