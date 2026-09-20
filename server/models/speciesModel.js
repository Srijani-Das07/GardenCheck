const db = require("../db");
const AppError = require("../utils/AppError");

async function findAll() {
    const result = await db.execute("SELECT * FROM species ORDER BY name");
    return result.rows;
}

async function findById(id) {
    const result = await db.execute({ sql: "SELECT * FROM species WHERE id = ?", args: [id] });
    return result.rows[0] || null;
}

async function create(d) {
    const result = await db.execute({
        sql: `INSERT INTO species
              (name, watering_interval_days, sunlight_needs, fertilizing_interval_days, ideal_temp_min, ideal_temp_max, difficulty_level)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [d.name, d.watering_interval_days, d.sunlight_needs || null, d.fertilizing_interval_days || null,
               d.ideal_temp_min || null, d.ideal_temp_max || null, d.difficulty_level || null]
    });
    return findById(Number(result.lastInsertRowid));
}

async function update(id, d) {
    await db.execute({
        sql: `UPDATE species SET name = ?, watering_interval_days = ?, sunlight_needs = ?,
              fertilizing_interval_days = ?, ideal_temp_min = ?, ideal_temp_max = ?, difficulty_level = ?
              WHERE id = ?`,
        args: [d.name, d.watering_interval_days, d.sunlight_needs || null, d.fertilizing_interval_days || null,
               d.ideal_temp_min || null, d.ideal_temp_max || null, d.difficulty_level || null, id]
    });
    return findById(id);
}

async function remove(id) {
    const usage = await db.execute({ sql: "SELECT COUNT(*) AS count FROM plants WHERE species_id = ?", args: [id] });
    if (Number(usage.rows[0].count) > 0) {
        throw new AppError(409, "Cannot delete a species that still has plants assigned to it.");
    }
    await db.execute({ sql: "DELETE FROM species WHERE id = ?", args: [id] });
}

module.exports = { findAll, findById, create, update, remove };