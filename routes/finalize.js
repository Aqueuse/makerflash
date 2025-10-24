// --- routes/finalize.js ---
import express from "express";
import { readMeta, saveMeta } from "../utils/metaStore.js";

const router = express.Router();

router.post("/finalize", (req, res) => {
  try {
    const { uuid, client, order } = req.body;
    if (!uuid) return res.status(400).json({ ok: false, error: "Missing uuid" });

    const meta = readMeta(uuid);
    if (!meta) return res.status(404).json({ ok: false, error: "Unknown uuid" });

    meta.client = client || {};
    meta.order = order || {};
    meta.finalizedAt = new Date().toISOString();

    saveMeta(uuid, meta);
    res.json({ ok: true, uuid, message: "Commande enregistrée" });
  } catch (err) {
    console.error("Finalize error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
