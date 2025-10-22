// --- MakerFlash API ---
// Flux complet : check -> viewer -> modify -> finalize

import express from "express";
import multer from "multer";
import cors from "cors";
import morgan from "morgan";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.resolve("./uploads");
const META_DIR = path.join(UPLOAD_DIR, "meta");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR);

app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.json());

// --- Multer config ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Helpers ---
function isSTL(buffer) {
  const header = buffer.slice(0, 80).toString("utf8");
  return header.startsWith("solid") || header.trim().length > 0;
}

function isOBJ(buffer) {
  const text = buffer.toString("utf8", 0, 2000).trim();
  return /^v\\s+/m.test(text) || /^f\\s+/m.test(text);
}

function saveMeta(uuid, data) {
  const metaPath = path.join(META_DIR, `${uuid}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(data, null, 2));
}

function readMeta(uuid) {
  const metaPath = path.join(META_DIR, `${uuid}.json`);
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}

// --- POST /check ---
app.post("/check", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "No file" });

    if (file.size > 100 * 1024 * 1024)
      return res.status(400).json({ ok: false, error: "File too large" });

    const ext = path.extname(file.originalname).toLowerCase();
    let valid = false;
    if (ext === ".stl") valid = isSTL(file.buffer);
    else if (ext === ".obj") valid = isOBJ(file.buffer);
    if (!valid)
      return res.status(400).json({ ok: false, error: "Invalid STL/OBJ" });

    const uuid = nanoid(8);
    const filepath = path.join(UPLOAD_DIR, `${uuid}${ext}`);

    fs.writeFileSync(filepath, file.buffer);

    const meta = {
      uuid,
      filename: `${uuid}${ext}`,
      originalName: file.originalname,
      type: ext.slice(1),
      size: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveMeta(uuid, meta);

    console.log(`✅ File checked & saved: ${meta.filename}`);
    res.json({ ok: true, uuid, message: "Fichier valide et sauvegardé" });
  } catch (err) {
    console.error("Check error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// --- POST /modify ---
app.post("/modify", upload.single("file"), async (req, res) => {
  try {
    const { uuid } = req.body;
    if (!uuid) return res.status(400).json({ ok: false, error: "Missing uuid" });
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "No file" });

    const meta = readMeta(uuid);
    if (!meta)
      return res.status(404).json({ ok: false, error: "Unknown uuid" });

    const ext = path.extname(file.originalname).toLowerCase();
    const filepath = path.join(UPLOAD_DIR, `${uuid}${ext}`);

    fs.writeFileSync(filepath, file.buffer);
    meta.updatedAt = new Date().toISOString();
    meta.size = file.size;
    meta.type = ext.slice(1);
    meta.filename = `${uuid}${ext}`;
    saveMeta(uuid, meta);

    console.log(`♻️ File modified: ${uuid}${ext}`);
    res.json({ ok: true, uuid, message: "Fichier remplacé avec succès" });
  } catch (err) {
    console.error("Modify error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// --- POST /finalize ---
app.post("/finalize", (req, res) => {
  try {
    const { uuid, client, order } = req.body;
    if (!uuid) return res.status(400).json({ ok: false, error: "Missing uuid" });

    const meta = readMeta(uuid);
    if (!meta)
      return res.status(404).json({ ok: false, error: "Unknown uuid" });

    meta.client = client || {};
    meta.order = order || {};
    meta.finalizedAt = new Date().toISOString();

    saveMeta(uuid, meta);

    console.log(`📦 Command finalized for ${uuid}`);
    res.json({ ok: true, uuid, message: "Commande enregistrée" });
  } catch (err) {
    console.error("Finalize error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// --- GET /file/:uuid ---
app.get("/file/:uuid", (req, res) => {
  const uuid = req.params.uuid;
  const meta = readMeta(uuid);
  if (!meta) return res.status(404).json({ ok: false, error: "Not found" });

  const filepath = path.join(UPLOAD_DIR, meta.filename);
  if (!fs.existsSync(filepath))
    return res.status(404).json({ ok: false, error: "File missing" });

  res.sendFile(filepath);
});

// --- Servir les fichiers statiques ---
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static("public"));

app.get("/viewer", (req, res) => {
  res.sendFile(path.resolve("./public/viewer.html"));
});

// --- Démarrer le serveur ---
app.listen(PORT, () =>
  console.log(`🚀 MakerFlash API prête sur http://localhost:${PORT}`)
);
