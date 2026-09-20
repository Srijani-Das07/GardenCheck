const { createClient } = require("@libsql/client");
require("dotenv").config();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

db.execute("PRAGMA foreign_keys = ON").catch(() => {});

module.exports = db;