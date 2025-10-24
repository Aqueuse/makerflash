// --- server.js ---
// Point d'entrée de l'API MakerFlash

import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";

import checkRoute from "./routes/check.js";
import modifyRoute from "./routes/modify.js";
import finalizeRoute from "./routes/finalize.js";
import fileRoute from "./routes/file.js";

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.resolve("./uploads");

// Crée les répertoires nécessaires
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, "meta")))
  fs.mkdirSync(path.join(UPLOAD_DIR, "meta"), { recursive: true });

// Middlewares
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use(checkRoute);
app.use(modifyRoute);
app.use(finalizeRoute);
app.use(fileRoute);

// Fichiers statiques
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static("public"));

app.get("/viewer", (req, res) => {
  res.sendFile(path.resolve("./public/viewer.html"));
});

// Démarrage
app.listen(PORT, () =>
  console.log(`🚀 MakerFlash API prête sur http://localhost:${PORT}`)
);
