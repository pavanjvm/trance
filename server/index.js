const express = require("express");
const path = require("path");
const connectToDatabase = require("./configuration/config");
const routes = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000; // Use EB-assigned port

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());

connectToDatabase();

// ✅ Serve frontend files from "client/dist"
app.use(express.static(path.join(__dirname, "../client/dist")));

// ✅ SPA fallback for React/Vue/Angular routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// ✅ API routes (after serving static frontend)
app.use("/", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
