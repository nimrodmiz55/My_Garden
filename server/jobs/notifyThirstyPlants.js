const { Resend } = require('resend');
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

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Notify] RESEND_API_KEY not set — skipping email notifications');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: plants, error } = await supabase
    .from('plants')
    .select('id, nickname, last_watered_date, watering_interval_days');

  if (error) {
    console.error('[Notify] Failed to fetch plants:', error.message);
    return;
  }

  const thirsty = plants.filter(isThirsty);
  console.log(`[Notify] ${thirsty.length} thirsty plant(s) found`);

  if (!thirsty.length) return;

  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) {
    console.error('[Notify] NOTIFICATION_EMAIL is not set — cannot send emails');
    return;
  }
  console.log(`[Notify] Sending to: ${to}`);

  for (const plant of thirsty) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'MyGarden <onboarding@resend.dev>',
        to,
        subject: `💧 ${plant.nickname} needs watering!`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#2d6a4f">🌿 My Garden</h2>
            <p>Your plant <strong>${plant.nickname}</strong> is thirsty and needs to be watered!</p>
            <p style="color:#6b7280;font-size:0.9em">
              Open your garden app to log today's watering and keep it healthy.
            </p>
          </div>
        `,
      });
      if (error) {
        console.error(`[Notify] Resend rejected email for "${plant.nickname}":`, error);
      } else {
        console.log(`[Notify] Email queued for "${plant.nickname}" — Resend id: ${data.id}`);
      }
    } catch (err) {
      console.error(`[Notify] Failed to send email for "${plant.nickname}":`, err.message);
    }
  }
}

module.exports = notifyThirstyPlants;
