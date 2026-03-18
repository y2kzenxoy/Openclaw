import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getSettings } from "../lib/settings.js";

const router: IRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${safe}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

router.get("/list", (req, res) => {
  const settings = getSettings();
  if (!settings.enableFileAccess) {
    res.json({ files: [], path: "/" });
    return;
  }

  try {
    const files = fs.readdirSync(UPLOAD_DIR).map((name) => {
      const fullPath = path.join(UPLOAD_DIR, name);
      const stat = fs.statSync(fullPath);
      const ext = path.extname(name).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".py": "text/x-python",
        ".js": "text/javascript",
        ".ts": "text/typescript",
        ".json": "application/json",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
      };

      return {
        name,
        size: stat.size,
        type: stat.isDirectory() ? "directory" as const : "file" as const,
        modified: stat.mtime.toISOString(),
        mimeType: mimeMap[ext] || "application/octet-stream",
      };
    });

    res.json({ files, path: "/" });
  } catch {
    res.json({ files: [], path: "/" });
  }
});

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  res.json({
    success: true,
    filename: req.file.filename,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
  });
});

router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const safe = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safe);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.download(filePath, safe);
});

router.delete("/delete", (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    res.status(400).json({ error: "filename is required" });
    return;
  }

  const safe = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safe);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: `Deleted ${safe}` });
    } else {
      res.json({ success: false, message: "File not found" });
    }
  } catch (err: any) {
    res.json({ success: false, message: err.message });
  }
});

export default router;
