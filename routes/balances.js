const express = require("express");
const Balance = require("../models/Balance");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  const owes = await Balance.find({ from: userId });
  const owedBy = await Balance.find({ to: userId });

  res.json({ owes, owedBy });
});

module.exports = router;
