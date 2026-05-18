const express = require('express');
const notifyThirstyPlants = require('../jobs/notifyThirstyPlants');

const router = express.Router();

// POST /api/internal/notify
// Called by an external cron service (e.g. cron-job.org) once a day.
// Guards with a shared secret so only the cron service can trigger it.
router.post('/notify', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured on the server' });
  }

  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Respond immediately so the external cron service doesn't time out
  // while the SMTP handshake and email sending happen in the background.
  res.json({ ok: true, message: 'Notification job started' });

  notifyThirstyPlants().catch((err) => {
    console.error('[Internal] /notify background error:', err.message);
  });
});

module.exports = router;
