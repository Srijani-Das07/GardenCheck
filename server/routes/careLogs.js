const express = require("express");
const router = express.Router();
const careLogModel = require("../models/careLogModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const VALID_ACTIONS = ["watered", "fertilized", "repotted", "pruned"];

router.get("/plant/:plantId", asyncHandler(async (req, res) => {
    res.json(await careLogModel.findByPlant(req.params.plantId));
}));

router.post("/", asyncHandler(async (req, res) => {
    const { plant_id, action_type, date_performed } = req.body;
    if (!plant_id) throw new AppError(400, "plant_id is required.");
    if (!VALID_ACTIONS.includes(action_type)) throw new AppError(400, "Invalid action type.");
    if (!date_performed) throw new AppError(400, "Date is required.");
    res.status(201).json(await careLogModel.create(req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
    await careLogModel.remove(req.params.id);
    res.json({ success: true });
}));

module.exports = router;