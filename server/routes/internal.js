const express = require('express');
const supabase = require('../supabase');
const notifyThirstyPlants = require('../jobs/notifyThirstyPlants');

const router = express.Router();

// POST /api/internal/notify
// Called by an external cron service (e.g. cron-job.org) once a day.
// Guards with a shared secret so only the cron service can trigger it.
// Idempotent: returns 200 "Already sent today" on duplicate calls within the same day.
router.post('/notify', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured on the server' });
  }

  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Idempotency check: skip if notifications were already sent today.
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const { data: existing } = await supabase
    .from('notification_runs')
    .select('run_date')
    .eq('run_date', today)
    .maybeSingle();

  if (existing) {
    return res.json({ ok: true, message: 'Already sent today' });
  }

  // Respond immediately so the external cron service doesn't time out
  // while the SMTP handshake and email sending happen in the background.
  res.json({ ok: true, message: 'Notification job started' });

  notifyThirstyPlants().catch((err) => {
    console.error('[Internal] /notify background error:', err.message);
  });
});

module.exports = router;
