const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const user = await User.create(req.body);

    res.status(201).json(user);
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
});

module.exports = router;
