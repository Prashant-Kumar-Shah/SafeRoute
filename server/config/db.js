/*const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// ============================================================
// LOUD FAIL — This was the root cause of the hackathon failure.
// Never silently fall back to localhost.
// ============================================================
if (!MONGODB_URI) {
  console.error('\n❌ FATAL: MONGODB_URI environment variable is not set.');
  console.error('   Create a .env file in /server with MONGODB_URI=mongodb+srv://...\n');
  process.exit(1);
}

const isAtlas = MONGODB_URI.startsWith('mongodb+srv://') || 
                (MONGODB_URI.startsWith('mongodb://') && MONGODB_URI.includes('.mongodb.net'));

if (!isAtlas) {
  console.error('\n❌ FATAL: MONGODB_URI must be a MongoDB Atlas URI (starts with mongodb+srv:// or contains .mongodb.net)');
  console.error('   Currently set to:', MONGODB_URI.substring(0, 40) + '...');
  console.error('   A local mongodb:// URI will NOT work in production and caused your hackathon failure.\n');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Atlas Network Access → Whitelist 0.0.0.0/0');
    console.error('  2. Check password in connection string (no special chars unescaped)');
    console.error('  3. Check cluster is not paused\n');
    process.exit(1);
  }
};

module.exports = connectDB;

*/

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;