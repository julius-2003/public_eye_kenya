import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Report from './src/models/Report.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB. Cleaning up dummy AI flags...');
  
  const result = await Report.updateMany(
    { aiFlag: true },
    { 
      $set: { aiFlag: false },
      $unset: { aiRiskScore: "", aiPattern: "" }
    }
  );
  
  console.log('Cleaned up', result.modifiedCount, 'reports. They will be re-scanned by the real AI automatically.');
  process.exit(0);
}
run().catch(err => {
  console.error(err);
  process.exit(1);
});
