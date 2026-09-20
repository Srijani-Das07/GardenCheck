const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

router.put("/:id", asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    if (!name || !name.trim()) throw new AppError(400, "Name is required.");
    if (!email) throw new AppError(400, "Email is required.");
    const user = await userModel.update(req.params.id, { name: name.trim(), email: email.trim().toLowerCase() });
    res.json(user);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    await userModel.remove(req.params.id);
    res.json({ success: true });
}));

module.exports = router;