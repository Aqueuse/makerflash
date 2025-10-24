// --- utils/metaStore.js ---
import fs from "fs";
import path from "path";

const META_DIR = path.resolve("./uploads/meta");
if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR, { recursive: true });

export function saveMeta(uuid, data) {
  const metaPath = path.join(META_DIR, `${uuid}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(data, null, 2));
}

export function readMeta(uuid) {
  const metaPath = path.join(META_DIR, `${uuid}.json`);
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}
