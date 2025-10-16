const mongoose = require("mongoose");

// Use cloud database by default, fallback to local if MONGO_URI is not set
const uri = process.env.MONGO_URI || "mongodb+srv://david:567890@cluster0.rxyuatj.mongodb.net/yogidb";

mongoose.connect(uri)
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
});

module.exports =  mongoose;

