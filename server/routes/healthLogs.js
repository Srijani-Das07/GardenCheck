const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/plant/:plantId", async (req, res) => {
    const result = await db.execute({
        sql: "SELECT * FROM health_logs WHERE plant_id = ? ORDER BY date_logged DESC",
        args: [req.params.plantId]
    });
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { plant_id, status, date_logged } = req.body;
    const result = await db.execute({
        sql: `INSERT INTO health_logs (plant_id, status, date_logged) VALUES (?, ?, ?)`,
        args: [plant_id, status, date_logged]
    });
    res.json({ id: Number(result.lastInsertRowid) });
});

router.delete("/:id", async (req, res) => {
    await db.execute({ sql: "DELETE FROM health_logs WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
});

module.exports = router;