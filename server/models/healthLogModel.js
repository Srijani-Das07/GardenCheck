const db = require("../db");

async function findByPlant(plantId) {
    const result = await db.execute({
        sql: "SELECT * FROM health_logs WHERE plant_id = ? ORDER BY date_logged DESC, id DESC",
        args: [plantId]
    });
    return result.rows;
}

async function create(d) {
    const result = await db.execute({
        sql: "INSERT INTO health_logs (plant_id, status, date_logged) VALUES (?, ?, ?)",
        args: [d.plant_id, d.status, d.date_logged]
    });
    return { id: Number(result.lastInsertRowid) };
}

async function remove(id) {
    await db.execute({ sql: "DELETE FROM health_logs WHERE id = ?", args: [id] });
}

module.exports = { findByPlant, create, remove };