const express = require('express');
const multer = require('multer');

const router = express.Router();

// Keep the file in memory so the buffer is available for the Gemini API call
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/', upload.single('photo'), (req, res) => {
  const { nickname, lastWatered } = req.body;
  const photo = req.file;

  if (!photo) {
    return res.status(400).json({ error: 'A plant photo is required' });
  }
  if (!nickname || !lastWatered) {
    return res.status(400).json({ error: 'nickname and lastWatered are required' });
  }

  // Placeholder — next step will forward this to the Gemini API
  res.json({
    message: 'Plant data received',
    nickname,
    lastWatered,
    photo: {
      originalname: photo.originalname,
      mimetype: photo.mimetype,
      size: photo.size,
    },
  });
});

module.exports = router;
