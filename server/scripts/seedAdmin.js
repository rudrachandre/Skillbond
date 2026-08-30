/**
 * Seed script — creates (or promotes) the default admin account.
 * Run manually with: `node scripts/seedAdmin.js`
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

const seedAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not configured. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (!existing) {
    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // hashed by the User pre-save hook
      role: 'admin',
    });
    console.log(`Admin account created: ${ADMIN_EMAIL} (role: admin)`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    console.log(`Existing user ${ADMIN_EMAIL} promoted to role: admin`);
  } else {
    console.log(`Admin account already exists: ${ADMIN_EMAIL} (role: admin)`);
  }

  await mongoose.disconnect();
  console.log('Done. Disconnected from MongoDB.');
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
