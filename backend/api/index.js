const express = require("express");
const otpRoutes = require("./routes/otp");
const userRoutes = require("./routes/user");
const cors = require("cors");


const app = express();

app.use(cors({
  origin: "*",
  credentials: true 
}));
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend started");
});

app.use("/otp", otpRoutes);
app.use("/user", userRoutes); 
module.exports = app;
