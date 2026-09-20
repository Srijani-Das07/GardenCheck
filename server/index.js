const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/species", require("./routes/species"));
app.use("/api/plants", require("./routes/plants"));
app.use("/api/care_logs", require("./routes/careLogs"));
app.use("/api/health_logs", require("./routes/healthLogs"));
app.use("/api/due_status", require("./routes/dueStatus"));

app.use(express.static(path.join(__dirname, "../public"), { index: false }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found." });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));