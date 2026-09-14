const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    const result = await db.execute("SELECT * FROM care_logs ORDER BY date_performed DESC");
    res.json(result.rows);
});

router.get("/plant/:plantId", async (req, res) => {
    const result = await db.execute({
        sql: "SELECT * FROM care_logs WHERE plant_id = ? ORDER BY date_performed DESC",
        args: [req.params.plantId]
    });
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { plant_id, action_type, date_performed, notes } = req.body;
    const result = await db.execute({
        sql: `INSERT INTO care_logs (plant_id, action_type, date_performed, notes) VALUES (?, ?, ?, ?)`,
        args: [plant_id, action_type, date_performed, notes]
    });
    res.json({ id: Number(result.lastInsertRowid) });
});

router.delete("/:id", async (req, res) => {
    await db.execute({ sql: "DELETE FROM care_logs WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
});

module.exports = router;