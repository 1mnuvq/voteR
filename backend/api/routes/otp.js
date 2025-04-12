const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const clientPromise = require("../mongodb");

const router = express.Router();

const otpMemoryStore = new Map();

// Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP Route
router.post("/send-otp", async (req, res) => {
  const { collegeId } = req.body;

  if (!collegeId) {
    return res.status(400).json({ error: "College ID is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your actual DB name
    const collection = db.collection("students");
    const student = await collection.findOne({ "ID no": parseInt(collegeId) });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const email = student["Student email"];
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpMemoryStore.set(collegeId, { otp, expiresAt });
    setTimeout(() => otpMemoryStore.delete(collegeId), 10 * 60 * 1000); // auto-expire

    const mailOptions = {
      from: `"CR Voting" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for CR Voting",
      text: `Hello ${student["Full Name"]},\n\nYour OTP is ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Sent OTP ${otp} to ${email}`);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Verify OTP Route
router.post("/verify-otp", async (req, res) => {
  const { collegeId, otp } = req.body;

  const record = otpMemoryStore.get(collegeId);
  if (!record) {
    return res.status(400).json({ error: "No OTP found. Try requesting again." });
  }

  if (Date.now() > record.expiresAt) {
    otpMemoryStore.delete(collegeId);
    return res.status(400).json({ error: "OTP expired. Please request again." });
  }

  if (record.otp !== otp) {
    return res.status(401).json({ error: "Incorrect OTP." });
  }

  otpMemoryStore.delete(collegeId);
  res.json({ message: "OTP verified successfully" });
});

module.exports = router;
