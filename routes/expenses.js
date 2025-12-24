const express = require("express");
const mongoose = require("mongoose");
const Balance = require("../models/Balance");
const User = require("../models/User");
const router = express.Router();

async function resolveUserId(identifier) {
  if (!identifier) throw new Error("Missing user identifier");

  // if it's already a valid ObjectId string, return as-is
  if (mongoose.Types.ObjectId.isValid(identifier)) return identifier;

  // otherwise try to find the user by name or email
  const user = await User.findOne({ $or: [{ email: identifier }, { name: identifier }] });
  if (!user) throw new Error(`User not found: ${identifier}`);
  return user._id;
}

async function updateBalance(from, to, amount) {
  if (String(from) === String(to)) return;

  const reverse = await Balance.findOne({ from: to, to: from });

  if (reverse) {
    if (reverse.amount > amount) {
      reverse.amount -= amount;
      await reverse.save();
    } else if (reverse.amount < amount) {
      await Balance.create({
        from,
        to,
        amount: amount - reverse.amount
      });
      await reverse.deleteOne();
    } else {
      await reverse.deleteOne();
    }
  } else {
    await Balance.create({ from, to, amount });
  }
}

router.post("/", async (req, res) => {
  try {
    const { paidBy, amount, splitType, splits } = req.body;

    if (!paidBy || typeof amount !== "number" || !splitType || !Array.isArray(splits)) {
      return res.status(400).json({ message: "Invalid request payload" });
    }

    const paidById = await resolveUserId(paidBy);
      console.log("Paid by user ID:", paidById);
    if (splitType === "EQUAL") {
      const share = amount / splits.length;
      for (let userId of splits) {
        const uid = await resolveUserId(userId);
        await updateBalance(uid, paidById, share);
      }
    } else if (splitType === "EXACT") {
      for (let s of splits) {
        const uid = await resolveUserId(s.userId);
        await updateBalance(uid, paidById, s.amount);
      }
    } else if (splitType === "PERCENT") {
      for (let s of splits) {
        const uid = await resolveUserId(s.userId);
        const share = (amount * s.percent) / 100;
        await updateBalance(uid, paidById, share);
      }
    } else {
      return res.status(400).json({ message: "Invalid splitType" });
    }

    res.send("Expense added successfully");
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = router;
