require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
 
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Please add it to your .env or environment variables.");
  process.exit(1);
}

 
mongoose.connect(process.env.MONGO_URI, {
   
  serverSelectionTimeoutMS: 30000
})
  .then(() => {
    console.log("MongoDB Connected");

   
    mongoose.connection.on("error", err => {
      console.error("MongoDB connection error:", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    app.use("/users", require("./routes/users"));
    app.use("/groups", require("./routes/groups"));
    app.use("/expenses", require("./routes/expenses"));
    app.use("/balances", require("./routes/balances"));

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
