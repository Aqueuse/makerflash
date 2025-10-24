// --- routes/check.js ---
import express from "express";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { upload } from "../config/multer.js";
import { isSTL, isOBJ, computeHash, findExistingFile } from "../utils/fileHelpers.js";
import { saveMeta } from "../utils/metaStore.js";

const router = express.Router();
const UPLOAD_DIR = path.resolve("./uploads");

router.post("/check", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "No file" });

    if (file.size > 100 * 1024 * 1024)
      return res.status(400).json({ ok: false, error: "File too large" });

    const ext = path.extname(file.originalname).toLowerCase();
    const hash = computeHash(file.buffer);
    const existingUuid = findExistingFile(UPLOAD_DIR, hash);

    // 🔁 FICHIER DÉJÀ PRÉSENT : garantir que le JSON meta existe
    if (existingUuid) {
      const metaDir = path.join(UPLOAD_DIR, "meta");
      const metaPath = path.join(metaDir, `${existingUuid}.json`);

      // NEW: créer/mettre à jour le meta si absent/incomplet
      if (!fs.existsSync(metaPath)) {
        // retrouver le fichier physique pour connaître l’extension et la taille
        const existingFile = fs.readdirSync(UPLOAD_DIR).find(f =>
          (f.endsWith(".stl") || f.endsWith(".obj")) && path.parse(f).name === existingUuid
        );

        if (existingFile) {
          const stat = fs.statSync(path.join(UPLOAD_DIR, existingFile));
          const newMeta = {
            uuid: existingUuid,
            filename: existingFile,
            originalName: file.originalname || existingFile, // on garde au moins quelque chose
            type: path.extname(existingFile).slice(1),
            size: stat.size,
            hash, // NEW: on profite du /check pour stocker le hash
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveMeta(existingUuid, newMeta);
        }
      } else {
        // NEW: on met à jour quelques champs utiles (hash/updatedAt)
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        if (!meta.hash) meta.hash = hash;
        meta.updatedAt = new Date().toISOString();
        saveMeta(existingUuid, meta);
      }

      return res.json({
        ok: true,
        uuid: existingUuid,
        reused: true,
        message: "Fichier déjà présent sur le serveur"
      });
    }

    // ✅ Validation du type de fichier
    const valid =
      ext === ".stl" ? isSTL(file.buffer) : ext === ".obj" ? isOBJ(file.buffer) : false;
    if (!valid) return res.status(400).json({ ok: false, error: "Invalid file" });

    // ✅ Nouveau fichier
    const uuid = nanoid(8);
    const filepath = path.join(UPLOAD_DIR, `${uuid}${ext}`);
    fs.writeFileSync(filepath, file.buffer);

    // NEW: on supprime l’appel à getModelDimensions (back épuré)
    const meta = {
      uuid,
      filename: `${uuid}${ext}`,
      originalName: file.originalname,
      type: ext.slice(1),
      size: file.size,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMeta(uuid, meta);
    console.log(`✅ Nouveau fichier enregistré: ${meta.filename}`);

    res.json({
      ok: true,
      uuid,
      reused: false,
      message: "Fichier sauvegardé"
    });
  } catch (err) {
    console.error("Check error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
