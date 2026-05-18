import express from "express";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Ensure upload directories exist
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const PORNSTARS_DIR = path.join(UPLOAD_ROOT, "pornstars");
const CHANNELS_DIR = path.join(UPLOAD_ROOT, "channels");
const VIDEOS_DIR = path.join(UPLOAD_ROOT, "videos");

fs.ensureDirSync(PORNSTARS_DIR);
fs.ensureDirSync(CHANNELS_DIR);
fs.ensureDirSync(VIDEOS_DIR);

// Static serving
app.use("/uploads", express.static(UPLOAD_ROOT));

// Multer setup for manual uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type; // 'pornstars', 'channels', or 'videos'
    let dest = VIDEOS_DIR;
    if (type === "pornstars") dest = PORNSTARS_DIR;
    else if (type === "channels") dest = CHANNELS_DIR;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only JPG, JPEG, PNG, and WEBP are allowed."));
    }
  },
});

// Helper to validate image from buffer
async function isValidImageBuffer(buffer: Buffer) {
  // Simple check for common image headers
  const hex = buffer.toString('hex', 0, 4);
  const headers = {
    '89504e47': 'png',
    'ffd8ffe0': 'jpg',
    'ffd8ffe1': 'jpg',
    'ffd8ffe2': 'jpg',
    'ffd8ffe3': 'jpg',
    'ffd8ffe8': 'jpg',
    '52494646': 'webp' // RIFF (for WEBP)
  };
  return Object.keys(headers).some(h => hex.startsWith(h));
}

// Routes
app.post("/api/images/import", async (req, res) => {
  const { url, type, oldPath } = req.body;

  if (!url || !type) {
    return res.status(400).json({ error: "Missing URL or type" });
  }

  const destDir = type === "pornstars" ? PORNSTARS_DIR : type === "channels" ? CHANNELS_DIR : VIDEOS_DIR;

  try {
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
    const buffer = Buffer.from(response.data);

    // Validate image content
    if (!(await isValidImageBuffer(buffer))) {
       return res.status(400).json({ error: "URL does not point to a valid image." });
    }

    // Determine extension from content-type or URL
    let ext = path.extname(new URL(url).pathname).toLowerCase();
    if (!ext) {
      const contentType = String(response.headers["content-type"] || "");
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("jpeg")) ext = ".jpg";
      else if (contentType.includes("webp")) ext = ".webp";
      else ext = ".jpg";
    }

    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(destDir, fileName);

    await fs.writeFile(filePath, buffer);

    // Cleanup old file if it exists and is local
    if (oldPath && oldPath.startsWith("/uploads/")) {
      const oldAbsolute = path.join(process.cwd(), oldPath);
      if (await fs.pathExists(oldAbsolute)) {
        await fs.remove(oldAbsolute);
      }
    }

    res.json({ url: `/uploads/${type}/${fileName}` });
  } catch (error: any) {
    console.error("Image import failed:", error.message);
    res.status(500).json({ error: "Failed to download image. The URL might be invalid or blocked." });
  }
});

app.post("/api/images/upload", upload.single("image"), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { type, oldPath } = req.body;
  const fileName = req.file.filename;

  // Cleanup old file if it exists and is local
  if (oldPath && oldPath.startsWith("/uploads/")) {
    const oldAbsolute = path.join(process.cwd(), oldPath);
    if (await fs.pathExists(oldAbsolute)) {
      await fs.remove(oldAbsolute);
    }
  }

  res.json({ url: `/uploads/${type}/${fileName}` });
});

app.post("/api/images/delete", async (req, res) => {
  const { path: filePath } = req.body;

  if (filePath && filePath.startsWith("/uploads/")) {
    const absolutePath = path.join(process.cwd(), filePath);
    try {
      if (await fs.pathExists(absolutePath)) {
        await fs.remove(absolutePath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  } else {
    res.status(400).json({ error: "Invalid path" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
