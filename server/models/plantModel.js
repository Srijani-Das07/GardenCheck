const db = require("../db");

async function findByUser(userId) {
    const result = await db.execute({
        sql: `SELECT plants.*, species.name AS species_name, species.watering_interval_days
              FROM plants JOIN species ON plants.species_id = species.id
              WHERE plants.user_id = ?
              ORDER BY plants.id DESC`,
        args: [userId]
    });
    return result.rows;
}

async function findById(id) {
    const result = await db.execute({
        sql: `SELECT plants.*, species.name AS species_name
              FROM plants JOIN species ON plants.species_id = species.id
              WHERE plants.id = ?`,
        args: [id]
    });
    return result.rows[0] || null;
}

async function create(d) {
    const result = await db.execute({
        sql: `INSERT INTO plants (user_id, species_id, nickname, date_acquired, location) VALUES (?, ?, ?, ?, ?)`,
        args: [d.user_id, d.species_id, d.nickname || null, d.date_acquired, d.location || null]
    });
    return findById(Number(result.lastInsertRowid));
}

async function update(id, d) {
    await db.execute({
        sql: `UPDATE plants SET species_id = ?, nickname = ?, date_acquired = ?, location = ? WHERE id = ?`,
        args: [d.species_id, d.nickname || null, d.date_acquired, d.location || null, id]
    });
    return findById(id);
}

async function remove(id) {
    await db.batch([
        { sql: "DELETE FROM care_logs WHERE plant_id = ?", args: [id] },
        { sql: "DELETE FROM health_logs WHERE plant_id = ?", args: [id] },
        { sql: "DELETE FROM plants WHERE id = ?", args: [id] }
    ], "write");
}

module.exports = { findByUser, findById, create, update, remove };