const db = require("../db");

async function findByPlant(plantId) {
    const result = await db.execute({
        sql: "SELECT * FROM care_logs WHERE plant_id = ? ORDER BY date_performed DESC, id DESC",
        args: [plantId]
    });
    return result.rows;
}

async function create(d) {
    const result = await db.execute({
        sql: "INSERT INTO care_logs (plant_id, action_type, date_performed, notes) VALUES (?, ?, ?, ?)",
        args: [d.plant_id, d.action_type, d.date_performed, d.notes || null]
    });
    return { id: Number(result.lastInsertRowid) };
}

async function remove(id) {
    await db.execute({ sql: "DELETE FROM care_logs WHERE id = ?", args: [id] });
}

module.exports = { findByPlant, create, remove };