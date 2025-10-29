const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Hashed password:', hash);
console.log('\nAdd this to your .env.local file as ADMIN_PASSWORD');

