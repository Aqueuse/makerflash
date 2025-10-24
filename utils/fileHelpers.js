// --- utils/fileHelpers.js ---
import fs from "fs";
import path from "path";
import crypto from "crypto";

export function isSTL(buffer) {
  const header = buffer.slice(0, 80).toString("utf8");
  return header.startsWith("solid") || header.trim().length > 0;
}

export function isOBJ(buffer) {
  const text = buffer.toString("utf8", 0, 2000).trim();
  return /^v\s+/m.test(text) || /^f\s+/m.test(text);
}

export function computeHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function findExistingFile(dir, hash) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".stl") || f.endsWith(".obj"));
  for (const file of files) {
    const existingBuffer = fs.readFileSync(path.join(dir, file));
    const existingHash = computeHash(existingBuffer);
    if (existingHash === hash) return path.parse(file).name;
  }
  return null;
}
