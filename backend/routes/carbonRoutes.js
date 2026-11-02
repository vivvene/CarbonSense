import express from "express";
import { calculateCarbon } from "../controllers/carbonController.js";

const router = express.Router();

// POST /api/carbon/calculate
router.post("/calculate", calculateCarbon);

export default router;
