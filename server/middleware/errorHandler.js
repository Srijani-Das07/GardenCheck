const AppError = require("../utils/AppError");

module.exports = function errorHandler(err, req, res, next) {
    console.error(err);

    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message });
    }
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ error: "That value already exists." });
    }
    if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
        return res.status(409).json({ error: "This action conflicts with related data." });
    }
    res.status(500).json({ error: "Something went wrong. Please try again." });
};