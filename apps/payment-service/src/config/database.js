import mongoose from 'mongoose';

export async function connectDB() {
  // Read env var at runtime (after dotenv.config() has run)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-db';

  try {
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected:', mongoUri);
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

export async function closeDB() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

export default mongoose;
