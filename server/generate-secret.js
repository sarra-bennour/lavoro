const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random 64-byte (512-bit) secret key
const secretKey = crypto.randomBytes(64).toString('hex');

// Define the path to the .env file
const envPath = path.join(__dirname, '.env');

// Write the secret key to the .env file
fs.writeFileSync(envPath, `SESSION_SECRET=${secretKey}\n`, { flag: 'a' });

console.log('Secret key has been written to .env file.');