const express = require("express");
const router = express.Router();
const dueStatusModel = require("../models/dueStatusModel");
const asyncHandler = require("../utils/asyncHandler");

router.get("/:userId", asyncHandler(async (req, res) => {
    res.json(await dueStatusModel.findByUser(req.params.userId));
}));

module.exports = router;