const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));

const path = require("path");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.use(express.static("public"));
app.use("/api/users", require("./routes/users"));
app.use("/api/species", require("./routes/species"));
app.use("/api/plants", require("./routes/plants"));
app.use("/api/care_logs", require("./routes/careLogs"));
app.use("/api/health_logs", require("./routes/healthLogs"));
app.use("/api/due_status", require("./routes/dueStatus"));

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));