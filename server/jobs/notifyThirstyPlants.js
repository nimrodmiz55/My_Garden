const nodemailer = require('nodemailer');
const { resolve4 } = require('dns').promises;
const supabase = require('../supabase');

function isThirsty(plant) {
  const [y, m, d] = plant.last_watered_date.split('-').map(Number);
  const nextWatering = new Date(y, m - 1, d);
  nextWatering.setDate(nextWatering.getDate() + plant.watering_interval_days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= nextWatering;
}

async function notifyThirstyPlants() {
  console.log('[Notify] Running thirsty-plant check…');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Notify] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping');
    return;
  }

  // Resolve smtp.gmail.com to an IPv4 address ourselves — Render's free
  // tier drops IPv6 SMTP connections, and Nodemailer's family:4 option
  // only affects the connect() call after DNS already returned an IPv6 addr.
  const [smtpIp] = await resolve4('smtp.gmail.com');
  console.log(`[Notify] Resolved smtp.gmail.com → ${smtpIp}`);

  const transporter = nodemailer.createTransport({
    host: smtpIp,       // raw IPv4 — no further DNS lookup by Nodemailer
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      servername: 'smtp.gmail.com', // cert validation still uses the real hostname
      rejectUnauthorized: false,
    },
  });

  // Fetch every plant that has an owner email
  const { data: plants, error } = await supabase
    .from('plants')
    .select('id, nickname, last_watered_date, watering_interval_days, owner_email')
    .not('owner_email', 'is', null);

  if (error) {
    console.error('[Notify] Failed to fetch plants:', error.message);
    return;
  }

  const thirsty = plants.filter(isThirsty);
  console.log(`[Notify] ${thirsty.length} thirsty plant(s) found across all users`);
  if (!thirsty.length) return;

  // Group thirsty plants by owner so each user gets one email
  const byOwner = {};
  for (const plant of thirsty) {
    if (!byOwner[plant.owner_email]) byOwner[plant.owner_email] = [];
    byOwner[plant.owner_email].push(plant);
  }

  for (const [ownerEmail, userPlants] of Object.entries(byOwner)) {
    const count = userPlants.length;
    const subject = count === 1
      ? `💧 ${userPlants[0].nickname} needs watering!`
      : `💧 ${count} of your plants need watering!`;

    const plantListHtml = userPlants
      .map((p) => `<li style="margin:4px 0"><strong>${p.nickname}</strong></li>`)
      .join('');

    try {
      const info = await transporter.sendMail({
        from: `"My Garden" <${process.env.GMAIL_USER}>`,
        to: ownerEmail,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#2d6a4f">🌿 My Garden</h2>
            <p>The following plant${count > 1 ? 's are' : ' is'} thirsty and need watering today:</p>
            <ul style="padding-left:20px">${plantListHtml}</ul>
            <p style="color:#6b7280;font-size:0.9em">
              Open your garden app to log today's watering and keep them healthy.
            </p>
          </div>
        `,
      });
      console.log(`[Notify] Email sent → ${ownerEmail} (messageId: ${info.messageId})`);
    } catch (err) {
      console.error(`[Notify] Failed to send to ${ownerEmail}:`, err.message);
    }
  }
}

module.exports = notifyThirstyPlants;
