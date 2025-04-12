const express = require("express");
const otpRoutes = require("./routes/otp");
const userRoutes = require("./routes/user");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend started");
});

app.use("/otp", otpRoutes);
app.use("/user", userRoutes); 
module.exports = app;
