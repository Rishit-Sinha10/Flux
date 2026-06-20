import express from "express";
import { generateChatResponse } from "../controller/gemini.controller.js";
const router = express.Router();
// POST /api/gemini/chat
router.post("/chat", generateChatResponse);
export default router;
