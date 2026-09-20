const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/user/:userId", async (req, res) => {
    const result = await db.execute({
        sql: `SELECT plants.*, species.name AS species_name
              FROM plants JOIN species ON plants.species_id = species.id
              WHERE plants.user_id = ?`,
        args: [req.params.userId]
    });
    res.json(result.rows);
});

router.post("/", async (req, res) => {
    const { user_id, species_id, nickname, date_acquired, location } = req.body;
    const result = await db.execute({
        sql: `INSERT INTO plants (user_id, species_id, nickname, date_acquired, location)
              VALUES (?, ?, ?, ?, ?)`,
        args: [user_id, species_id, nickname, date_acquired, location]
    });
    res.json({ id: Number(result.lastInsertRowid) });
});

router.put("/:id", async (req, res) => {
    const { user_id, species_id, nickname, date_acquired, location } = req.body;
    await db.execute({
        sql: `UPDATE plants SET user_id = ?, species_id = ?, nickname = ?, date_acquired = ?, location = ?
              WHERE id = ?`,
        args: [user_id, species_id, nickname, date_acquired, location, req.params.id]
    });
    res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
    await db.execute({ sql: "DELETE FROM plants WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
});

module.exports = router;