const express = require("express");
const app = express();
const path = require('path');

//app.use(express.static("public"));
app.use('/', express.static(path.join(__dirname + '/yogi-track/dist')));
app.use(express.json());


app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/class", require("./routes/classRoutes.cjs"));



const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log('Open http://localhost:8080/index.html in your browser to view the app.');
});
