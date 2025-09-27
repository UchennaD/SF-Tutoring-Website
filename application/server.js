const express = require("express");
const path = require("path");

const app = express();

// Serve everything inside application/code/frontend
app.use(express.static(path.join(__dirname, "code", "frontend")));

// Default route -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "code", "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
