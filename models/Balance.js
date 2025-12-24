const mongoose = require("mongoose");

module.exports = mongoose.model("Balance", {
  from: mongoose.Schema.Types.ObjectId,
  to: mongoose.Schema.Types.ObjectId,
  amount: Number
});
