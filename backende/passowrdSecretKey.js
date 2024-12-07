// passwordSecretKey.js

import crypto from 'crypto';

// Generate a random 128-byte secret key
const secretKey = crypto.randomBytes(128).toString('hex');

// Output the generated key to the console
console.log('Generated 128-byte Secret Key:', secretKey);
