// generateJWTSecret.js

import crypto from 'crypto';

// Generate a 32-byte random secret and convert to hex
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex'); // Change 'hex' to 'base64' if you prefer base64 encoding
};

// Generate and log the secret key
const secretKey = generateSecretKey();
console.log('Generated JWT Secret Key:', secretKey);
