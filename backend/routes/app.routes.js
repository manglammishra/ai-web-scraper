import { Router } from "express";
import { scrapePage } from "../services/scraper.js";
import { summarizeText } from "../services/ai.js";

const router = Router();

// POST /api/summarize  { "url": "https://example.com" }
router.post("/", async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A 'url' field is required." });
  }

  try {
    const { title, text } = await scrapePage(url.trim());
    const summary = await summarizeText(title, text);
    res.json({ title, summary, charactersRead: text.length });
  } catch (err) {
    console.error(err.message);
    res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
  }
});

export default router;
