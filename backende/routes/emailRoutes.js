import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { setupEmail } from '../controllers/emailController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import EmailSetup from '../models/EmailSetup.js';

const router = express.Router();

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Helper function to extract name-email pairs from CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (data.name && data.email) {
          results.push({ name: data.name, email: data.email });
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

// Helper function to extract name-email pairs from XLSX
const parseXLSX = (filePath) => {
  return new Promise((resolve, reject) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const results = [];

    rows.forEach((row) => {
      if (row.name && row.email) {
        results.push({ name: row.name, email: row.email });
      }
    });

    resolve(results);
  });
};

router.post('/setup-email', authMiddleware, setupEmail);

// Send Email Route
router.post('/send-email', authMiddleware, upload.fields([
  { name: 'file', maxCount: 1 }, // Main CSV/XLSX file
  { name: 'attachments', maxCount: 10 } // Attachments (images, docs, etc.)
]), async (req, res) => {
  const { subject, body } = req.body;
  const { file } = req.files;
  const attachments = req.files.attachments || [];

  if (!subject || !body || !file) {
    return res.status(400).json({ message: 'Subject, body, and file are required.' });
  }

  // Ensure the file is either CSV or XLSX (main file)
  if (!['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file[0].mimetype)) {
    return res.status(400).json({ message: 'Only CSV and XLSX files are allowed as main file.' });
  }

  try {
    const config = await EmailSetup.findOne({ user: req.user.id });

    if (!config) {
      return res.status(400).json({ message: 'Email configuration not found.' });
    }

    let decodedPassword;
    try {
      decodedPassword = jwt.verify(config.EMAIL_PASSWORD, process.env.PASSWORD_JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Failed to decode password token.' });
    }

    let recipients = [];
    if (file[0].mimetype === 'text/csv') {
      recipients = await parseCSV(file[0].path);
    } else if (file[0].mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      recipients = await parseXLSX(file[0].path);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No valid name-email pairs found in the file.' });
    }

    // Create the transporter with the SMTP settings
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, 
      auth: {
        user: config.EMAIL,
        pass: decodedPassword.password, 
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Prepare attachments (ensure only valid types are included)
    const validAttachments = attachments.filter((attachment) => {
      return ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        .includes(attachment.mimetype);
    }).map((attachment) => ({
      filename: attachment.originalname,
      path: attachment.path,
    }));

    // Send emails to all recipients
    const sendEmailPromises = recipients.map(async (recipient) => {
      const emailBody = body.replace(/{user}/g, recipient.name);
      const mailOptions = {
        from: config.EMAIL,
        to: recipient.email,
        subject,
        // text: emailBody,
        html: `<pre>${emailBody}</pre><footer>Mail marketing by <a href="https://anayasoftwares.in">Anayasoftwares</a></footer>`,
        attachments: validAttachments, // Attach valid files here
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${recipient.email}`);
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
      }
    });

    await Promise.all(sendEmailPromises);

    // Delete the uploaded file and attachments after processing
    fs.unlink(file[0].path, (err) => {
      if (err) {
        console.error("Error deleting main file:", err);
      } else {
        console.log("Main file deleted successfully");
      }
    });

    validAttachments.forEach((attachment) => {
      fs.unlink(attachment.path, (err) => {
        if (err) {
          console.error(`Error deleting attachment ${attachment.filename}:`, err);
        } else {
          console.log(`Attachment ${attachment.filename} deleted successfully`);
        }
      });
    });

    // Return success response
    res.status(200).json({
      message: 'Emails sent successfully to all recipients.',
      recipients,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'An error occurred while sending the emails.' });
  }
});

export default router;
