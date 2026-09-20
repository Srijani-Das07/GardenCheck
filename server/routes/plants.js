const express = require("express");
const router = express.Router();
const plantModel = require("../models/plantModel");
const speciesModel = require("../models/speciesModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

router.get("/user/:userId", asyncHandler(async (req, res) => {
    res.json(await plantModel.findByUser(req.params.userId));
}));

router.post("/", asyncHandler(async (req, res) => {
    const { user_id, species_id, date_acquired } = req.body;
    if (!user_id) throw new AppError(400, "user_id is required.");
    if (!species_id) throw new AppError(400, "Please choose a species.");
    if (!date_acquired) throw new AppError(400, "Date acquired is required.");
    const species = await speciesModel.findById(species_id);
    if (!species) throw new AppError(400, "Selected species does not exist.");
    res.status(201).json(await plantModel.create(req.body));
}));

router.put("/:id", asyncHandler(async (req, res) => {
    const { species_id, date_acquired } = req.body;
    if (!species_id) throw new AppError(400, "Please choose a species.");
    if (!date_acquired) throw new AppError(400, "Date acquired is required.");
    const existing = await plantModel.findById(req.params.id);
    if (!existing) throw new AppError(404, "Plant not found.");
    res.json(await plantModel.update(req.params.id, req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    await plantModel.remove(req.params.id);
    res.json({ success: true });
}));

module.exports = router;