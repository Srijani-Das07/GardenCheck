const express = require("express");
const router = express.Router();
const healthLogModel = require("../models/healthLogModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const VALID_STATUSES = ["thriving", "struggling", "dead"];

router.get("/plant/:plantId", asyncHandler(async (req, res) => {
    res.json(await healthLogModel.findByPlant(req.params.plantId));
}));

router.post("/", asyncHandler(async (req, res) => {
    const { plant_id, status, date_logged } = req.body;
    if (!plant_id) throw new AppError(400, "plant_id is required.");
    if (!VALID_STATUSES.includes(status)) throw new AppError(400, "Invalid status.");
    if (!date_logged) throw new AppError(400, "Date is required.");
    res.status(201).json(await healthLogModel.create(req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    await healthLogModel.remove(req.params.id);
    res.json({ success: true });
}));

module.exports = router;