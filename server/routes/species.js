const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    const result = await db.execute("SELECT * FROM species");
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level } = req.body;
    const result = await db.execute({
        sql: `INSERT INTO species
              (name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level]
    });
    res.json({ id: Number(result.lastInsertRowid) });
});

router.put("/:id", async (req, res) => {
    const { name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level } = req.body;
    await db.execute({
        sql: `UPDATE species SET name = ?, watering_interval_days = ?, sunlight_needs = ?,
              fertilizing_interval_days = ?, ideal_temp_min = ?, ideal_temp_max = ?, difficulty_level = ?
              WHERE id = ?`,
        args: [name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level, req.params.id]
    });
    res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
    await db.execute({ sql: "DELETE FROM species WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
});

module.exports = router;