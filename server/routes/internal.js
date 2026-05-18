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

  try {
    await notifyThirstyPlants();
    res.json({ ok: true });
  } catch (err) {
    console.error('[Internal] /notify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
