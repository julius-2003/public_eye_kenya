import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// Serve any uploaded file with proper CORS headers
router.get('/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params;
    
    // Security: prevent directory traversal
    if (folder.includes('..') || filename.includes('..')) {
      return res.status(400).json({ message: 'Invalid path' });
    }
    
    const filePath = path.join(uploadsDir, folder, filename);
    
    // Verify file exists and is within uploads directory
    const realPath = await fsp.realpath(filePath);
    if (!realPath.startsWith(await fsp.realpath(uploadsDir))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Set CORS headers explicitly
    const origin = req.get('origin');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Content-Disposition');
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    // Determine mime type
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File not found' });
      }
    });
  } catch (err) {
    console.error('Upload serve error:', err);
    if (!res.headersSent) {
      res.status(404).json({ message: 'File not found' });
    }
  }
});

export default router;
