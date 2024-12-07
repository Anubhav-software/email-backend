import jwt from 'jsonwebtoken';
import EmailSetup from '../models/EmailSetup.js';


export const setupEmail = async (req, res) => {
  const { SMTP_HOST, SMTP_PORT, EMAIL, EMAIL_PASSWORD } = req.body;

  if (!SMTP_HOST || !SMTP_PORT || !EMAIL || !EMAIL_PASSWORD) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

 
  if (isNaN(SMTP_PORT)) {
    return res.status(400).json({ message: 'SMTP_PORT must be a valid number.' });
  }

  try {
    
    const encodedPassword = jwt.sign({ password: EMAIL_PASSWORD }, process.env.PASSWORD_JWT_SECRET);
    console.log(encodedPassword)

    
    let existingConfig = await EmailSetup.findOne({ user: req.user.id });

    if (existingConfig) {
      
      existingConfig.SMTP_HOST = SMTP_HOST;
      existingConfig.SMTP_PORT = SMTP_PORT;
      existingConfig.EMAIL = EMAIL;
      existingConfig.EMAIL_PASSWORD = encodedPassword; 
      await existingConfig.save();

      return res.status(200).json({
        message: 'SMTP configuration updated successfully.',
        smtpConfig: existingConfig,
      });
    }

    
    const newConfig = new EmailSetup({
      user: req.user.id, 
      SMTP_HOST,
      SMTP_PORT,
      EMAIL,
      EMAIL_PASSWORD: encodedPassword, 
    });

    await newConfig.save();

    return res.status(200).json({
      message: 'SMTP configuration set up successfully.',
      smtpConfig: newConfig,
    });
  } catch (error) {
    console.error('Error setting up email configuration:', error.message);
    return res.status(500).json({ message: 'An error occurred while setting up the email configuration.' });
  }
};
