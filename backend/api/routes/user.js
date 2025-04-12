// api/routes/user.js

const express = require("express");
const jwt = require("jsonwebtoken");
const clientPromise = require("../mongodb");

const router = express.Router();

// Issue JWT after verifying OTP
router.post("/login", async (req, res) => {
  const { collegeId } = req.body;

  if (!collegeId) {
    return res.status(400).json({ error: "College ID is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Change to your actual DB name
    const collection = db.collection("students");
    const student = await collection.findOne({ "ID no": parseInt(collegeId) });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const fullName = student["Full Name"];

    const token = jwt.sign(
      { collegeId, fullName, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "OTP verified", token });
  } catch (err) {
    console.error("Error fetching student for token:", err);
    res.status(500).json({ error: "Server error generating token" });
  }
});

// Get user details using token
router.get("/user-details", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ fullName: payload.fullName });
  } catch (err) {
    console.error("Invalid token:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
