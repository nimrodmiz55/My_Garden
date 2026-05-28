const { Resend } = require('resend');
const supabase = require('../supabase');

async function recordRun() {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from('notification_runs')
    .upsert({ run_date: today }, { onConflict: 'run_date', ignoreDuplicates: true });
  if (error) {
    console.error('[Notify] Failed to record run in notification_runs:', error.message);
  } else {
    console.log(`[Notify] Run recorded for ${today}`);
  }
}

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

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Notify] RESEND_API_KEY not set — skipping');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (!thirsty.length) {
    await recordRun();
    return;
  }

  // Group by owner so each user gets one consolidated email
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
      .map((p) => `<li style="margin:6px 0"><strong>${p.nickname}</strong></li>`)
      .join('');

    const { data, error: sendError } = await resend.emails.send({
      from: 'My Garden <notifications@my-garden-bot.online>',
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

    if (sendError) {
      console.error(`[Notify] Resend rejected email to ${ownerEmail}:`, sendError);
    } else {
      console.log(`[Notify] Email sent → ${ownerEmail} (id: ${data.id})`);
    }
  }

  // Record that notifications ran today so duplicate cron hits are skipped.
  await recordRun();
}

module.exports = notifyThirstyPlants;
