const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }
    const existing = await db.execute({
        sql: "SELECT id FROM users WHERE email = ?",
        args: [email]
    });
    if (existing.rows.length > 0) {
        return res.status(409).json({ error: "An account with this email already exists." });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.execute({
        sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        args: [name, email, hashed]
    });
    res.json({ id: Number(result.lastInsertRowid), name, email });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }
    const result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ?",
        args: [email]
    });
    const user = result.rows[0];
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: "Invalid email or password." });
    }
    res.json({ id: user.id, name: user.name, email: user.email });
});

module.exports = router;