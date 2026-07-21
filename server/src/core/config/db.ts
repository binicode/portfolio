import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('MongoDB: reusing existing connection');
    return;
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB: connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB: connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB: disconnected');
    isConnected = false;
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    isConnected = true;
  } catch (err) {
    console.error('MongoDB: initial connection failed', err);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB: disconnected gracefully');
}

// Graceful shutdown on process termination signals
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});