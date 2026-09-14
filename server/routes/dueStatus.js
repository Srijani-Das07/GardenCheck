const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
    const result = await db.execute(`
        SELECT
            plants.id AS plant_id,
            plants.nickname,
            species.name AS species_name,
            last_watered.last_date AS last_watered_date,
            species.watering_interval_days,
            CAST(julianday('now') - julianday(last_watered.last_date) AS INTEGER) - species.watering_interval_days AS days_overdue
        FROM plants
        JOIN species ON plants.species_id = species.id
        LEFT JOIN (
            SELECT plant_id, MAX(date_performed) AS last_date
            FROM care_logs
            WHERE action_type = 'watered'
            GROUP BY plant_id
        ) last_watered ON last_watered.plant_id = plants.id
    `);
    res.json(result.rows);
});

module.exports = router;