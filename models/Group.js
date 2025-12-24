const mongoose = require("mongoose");

module.exports = mongoose.model("Group", {
  name: String,
  members: [mongoose.Schema.Types.ObjectId]
});
