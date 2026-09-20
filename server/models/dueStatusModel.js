const db = require("../db");

async function findByUser(userId) {
    const result = await db.execute({
        sql: `
        SELECT
            plants.id AS plant_id,
            plants.nickname,
            species.name AS species_name,
            last_watered.last_date AS last_watered_date,
            species.watering_interval_days,
            CASE
                WHEN last_watered.last_date IS NULL THEN NULL
                ELSE CAST(julianday('now') - julianday(last_watered.last_date) AS INTEGER) - species.watering_interval_days
            END AS days_overdue
        FROM plants
        JOIN species ON plants.species_id = species.id
        LEFT JOIN (
            SELECT plant_id, MAX(date_performed) AS last_date
            FROM care_logs
            WHERE action_type = 'watered'
            GROUP BY plant_id
        ) last_watered ON last_watered.plant_id = plants.id
        WHERE plants.user_id = ?
        ORDER BY days_overdue DESC
        `,
        args: [userId]
    });
    return result.rows;
}

module.exports = { findByUser };