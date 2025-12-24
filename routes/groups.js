const express = require("express");
const Group = require("../models/Group");
const router = express.Router();

router.post("/", async (req, res) => {
  const group = await Group.create(req.body);
  res.json(group);
});
module.exports = router;
