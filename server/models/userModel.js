const db = require("../db");

async function findByEmail(email) {
    const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
    return result.rows[0] || null;
}

async function findById(id) {
    const result = await db.execute({
        sql: "SELECT id, name, email, created_at FROM users WHERE id = ?",
        args: [id]
    });
    return result.rows[0] || null;
}

async function create({ name, email, passwordHash }) {
    const result = await db.execute({
        sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        args: [name, email, passwordHash]
    });
    return findById(Number(result.lastInsertRowid));
}

async function update(id, { name, email }) {
    await db.execute({ sql: "UPDATE users SET name = ?, email = ? WHERE id = ?", args: [name, email, id] });
    return findById(id);
}

async function remove(id) {
    await db.batch([
        { sql: "DELETE FROM care_logs WHERE plant_id IN (SELECT id FROM plants WHERE user_id = ?)", args: [id] },
        { sql: "DELETE FROM health_logs WHERE plant_id IN (SELECT id FROM plants WHERE user_id = ?)", args: [id] },
        { sql: "DELETE FROM plants WHERE user_id = ?", args: [id] },
        { sql: "DELETE FROM users WHERE id = ?", args: [id] }
    ], "write");
}

module.exports = { findByEmail, findById, create, update, remove };