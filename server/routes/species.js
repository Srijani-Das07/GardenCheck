const express = require("express");
const router = express.Router();
const speciesModel = require("../models/speciesModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

function validate(b) {
    if (!b.name || !b.name.trim()) throw new AppError(400, "Species name is required.");
    if (!b.watering_interval_days || Number(b.watering_interval_days) <= 0) {
        throw new AppError(400, "Watering interval must be a positive number.");
    }
}

router.get("/", asyncHandler(async (req, res) => {
    res.json(await speciesModel.findAll());
}));

router.post("/", asyncHandler(async (req, res) => {
    validate(req.body);
    res.status(201).json(await speciesModel.create(req.body));
}));

router.put("/:id", asyncHandler(async (req, res) => {
    validate(req.body);
    const existing = await speciesModel.findById(req.params.id);
    if (!existing) throw new AppError(404, "Species not found.");
    res.json(await speciesModel.update(req.params.id, req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    await speciesModel.remove(req.params.id);
    res.json({ success: true });
}));

module.exports = router;