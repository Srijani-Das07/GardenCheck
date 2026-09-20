const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !name.trim()) throw new AppError(400, "Name is required.");
    if (!email || !EMAIL_RE.test(email)) throw new AppError(400, "A valid email is required.");
    if (!password || password.length < 6) throw new AppError(400, "Password must be at least 6 characters.");

    const existing = await userModel.findByEmail(email.trim().toLowerCase());
    if (existing) throw new AppError(409, "An account with this email already exists.");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash });
    res.status(201).json(user);
}));

router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError(400, "Email and password are required.");

    const user = await userModel.findByEmail(email.trim().toLowerCase());
    if (!user) throw new AppError(401, "Invalid email or password.");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError(401, "Invalid email or password.");

    res.json({ id: user.id, name: user.name, email: user.email });
}));

module.exports = router;