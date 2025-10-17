const mongoose = require("mongoose");

// Use environment variable for database connection
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://david:567890@cluster0.rxyuatj.mongodb.net/yogidb";

console.log('Connecting to MongoDB...', uri.includes('mongodb+srv') ? 'Cloud Database' : 'Local Database');

mongoose.connect(uri)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  console.error("❌ Full error:", err);
});

module.exports =  mongoose;

