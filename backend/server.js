import "dotenv/config";
import express from "express";
import cors from "cors";
import summarizeRouter from "./routes/app.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowed }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/summarize", summarizeRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
