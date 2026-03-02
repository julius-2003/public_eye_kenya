import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const evidenceStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = 'uploads/evidence';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  }
});

const faceStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = 'uploads/faces';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `face-${Date.now()}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({ storage: evidenceStorage, limits: { fileSize: 10 * 1024 * 1024 } });
export const faceUpload = multer({ storage: faceStorage, limits: { fileSize: 5 * 1024 * 1024 } });
