const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image uploads are allowed'), false);
  }
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

router.post('/avatar', protect, (req, res) => {
  upload.single('avatar')(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ success: false, message: uploadError.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.status(201).json({ success: true, message: 'Avatar uploaded', data: { url } });
  });
});

module.exports = router;
