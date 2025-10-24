// --- routes/modify.js ---
import express from "express";
import path from "path";
import fs from "fs";
import { upload } from "../config/multer.js";
import { readMeta, saveMeta } from "../utils/metaStore.js";

const router = express.Router();
const UPLOAD_DIR = path.resolve("./uploads");

router.post("/modify", upload.single("file"), (req, res) => {
  try {
    const { uuid } = req.body;
    if (!uuid) return res.status(400).json({ ok: false, error: "Missing uuid" });
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "No file" });

    const meta = readMeta(uuid);
    if (!meta) return res.status(404).json({ ok: false, error: "Unknown uuid" });

    const ext = path.extname(file.originalname).toLowerCase();
    const filepath = path.join(UPLOAD_DIR, `${uuid}${ext}`);
    fs.writeFileSync(filepath, file.buffer);

    meta.updatedAt = new Date().toISOString();
    meta.size = file.size;
    meta.type = ext.slice(1);
    meta.filename = `${uuid}${ext}`;
    saveMeta(uuid, meta);

    res.json({ ok: true, uuid, message: "Fichier remplacé avec succès" });
  } catch (err) {
    console.error("Modify error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
