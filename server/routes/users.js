const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    const result = await db.execute("SELECT * FROM users");
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { name, email } = req.body;
    const result = await db.execute({
        sql: "INSERT INTO users (name, email) VALUES (?, ?)",
        args: [name, email]
    });
    res.json({ id: Number(result.lastInsertRowid) });
});

router.put("/:id", async (req, res) => {
    const { name, email } = req.body;
    await db.execute({
        sql: "UPDATE users SET name = ?, email = ? WHERE id = ?",
        args: [name, email, req.params.id]
    });
    res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
    await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
});

module.exports = router;