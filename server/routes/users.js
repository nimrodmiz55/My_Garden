const express = require('express');
const { Resend } = require('resend');

const router = express.Router();

// POST /api/users/welcome — send a one-time welcome email on first registration
router.post('/welcome', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Welcome] RESEND_API_KEY not set — skipping');
    return res.json({ ok: true, message: 'Email skipped (no API key)' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'My Garden <notifications@my-garden-bot.online>',
    to: email,
    subject: '🌿 Welcome to My Garden!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1b4332">🌿 Welcome to My Garden!</h2>
        <p>Hi there! You've successfully joined My Garden — your personal plant care companion.</p>

        <h3 style="color:#2d6a4f">⚠️ Important: Avoid Missing Watering Alerts</h3>
        <p>
          My Garden will send you an email reminder each time one of your plants needs watering.
          To make sure you never miss an alert, please take 30 seconds to do the following:
        </p>
        <ol style="padding-left:20px;line-height:1.8">
          <li>Find this email in your <strong>Promotions</strong> or <strong>Spam</strong> folder if needed.</li>
          <li>Mark it as <strong>"Not Spam"</strong>.</li>
          <li>Add <strong>notifications@my-garden-bot.online</strong> to your contacts.</li>
        </ol>

        <h3 style="color:#2d6a4f">🚀 Getting Started</h3>
        <p>
          Open the app, tap the camera button, and take a photo of your first plant.
          My Garden will automatically identify the species and figure out the right watering schedule for you.
        </p>

        <p style="color:#6b7280;font-size:0.9em;margin-top:32px">
          Happy growing!<br/>
          — The My Garden team
        </p>
      </div>
    `,
  });

  if (error) {
    console.error(`[Welcome] Resend rejected email to ${email}:`, error);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }

  console.log(`[Welcome] Email sent → ${email} (id: ${data.id})`);
  res.json({ ok: true });
});

module.exports = router;
