// --- routes/file.js ---
import express from "express";
import path from "path";
import fs from "fs";
import { readMeta } from "../utils/metaStore.js";

const router = express.Router();
const UPLOAD_DIR = path.resolve("./uploads");

router.get("/file/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  const meta = readMeta(uuid);
  if (!meta) return res.status(404).json({ ok: false, error: "Not found" });

  const filepath = path.join(UPLOAD_DIR, meta.filename);
  if (!fs.existsSync(filepath))
    return res.status(404).json({ ok: false, error: "File missing" });

  res.sendFile(filepath);
});

export default router;
