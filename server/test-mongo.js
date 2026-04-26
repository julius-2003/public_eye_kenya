import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

console.log('Attempting to connect to:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected!'))
  .catch(err => console.error('❌ Error:', err.message, err.code));