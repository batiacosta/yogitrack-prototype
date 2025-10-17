const express = require("express");
const app = express();
const path = require('path');

// Connect to MongoDB
require("./config/mongodbconn.cjs");

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (React app)
app.use('/', express.static(path.join(__dirname + '/yogi-track/dist')));


app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/class", require("./routes/classRoutes.cjs"));
app.use("/api/user", require("./routes/userRoutes.cjs"));
app.use("/api/auth", require("./routes/authRoutes.cjs"));
app.use("/api/manager", require("./routes/managerRoutes.cjs"));
app.use("/api/pass", require("./routes/passRoutes.cjs"));
app.use("/api/reports", require("./routes/reportsRoutes.cjs"));



const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log('Open http://localhost:8080/index.html in your browser to view the app.');
});
