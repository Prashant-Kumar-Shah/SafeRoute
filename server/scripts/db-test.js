/**
 * db-test.js — Run this FIRST on Day 0 before any feature work.
 * Validates MongoDB Atlas connection, inserts a doc, reads it back, cleans up.
 * USAGE: node scripts/db-test.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ FATAL: MONGODB_URI is not set in .env');
  process.exit(1);
}

if (!uri.startsWith('mongodb+srv://')) {
  console.error('❌ FATAL: MONGODB_URI must be a MongoDB Atlas connection string (mongodb+srv://)');
  console.error('   You have:', uri.substring(0, 30) + '...');
  console.error('   This was the root cause of the hackathon failure. Fix it before proceeding.');
  process.exit(1);
}

console.log('✅ MONGODB_URI format is valid (mongodb+srv://)');
console.log('🔌 Connecting to Atlas...');

async function run() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('   Host:', mongoose.connection.host);

    // Insert test doc
    const TestModel = mongoose.model('ConnectionTest', new mongoose.Schema({ msg: String, ts: Date }));
    const doc = await TestModel.create({ msg: 'saferoute-db-test', ts: new Date() });
    console.log('✅ Write succeeded — doc id:', doc._id.toString());

    // Read it back
    const found = await TestModel.findById(doc._id);
    if (!found) throw new Error('Read-back failed');
    console.log('✅ Read-back succeeded');

    // Clean up
    await TestModel.deleteOne({ _id: doc._id });
    console.log('✅ Cleanup done');

    console.log('\n🎉 DATABASE IS READY. You can now start Day 1 coding.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection FAILED:', err.message);
    console.error('\nCommon fixes:');
    console.error('  1. IP whitelist: In Atlas → Network Access → Add 0.0.0.0/0 for dev');
    console.error('  2. Wrong password in connection string');
    console.error('  3. Cluster name mismatch in URI');
    console.error('  4. Atlas cluster is paused (auto-pauses after 60 days on free tier)\n');
    process.exit(1);
  }
}

run();
