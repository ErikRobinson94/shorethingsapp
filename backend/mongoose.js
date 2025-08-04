// mongoose.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://erikdrobins:6EtgTFfMCiboMsip@shorecluster.mq8p3wz.mongodb.net/?retryWrites=true&w=majority&appName=shorecluster';

async function connectToMongo() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'shorethings'
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB', error);
    process.exit(1); // Stop the server if MongoDB fails
  }
}

module.exports = connectToMongo;
