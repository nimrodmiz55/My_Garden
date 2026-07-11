const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const supabase = require('../supabase');

const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const ANALYSIS_PROMPT = `You are a plant identification expert. Analyze this plant image and respond with ONLY a valid JSON object — no markdown, no explanation.

The JSON must contain exactly these three fields:
- "species": the common name of the plant species (string)
- "size": one of exactly "small", "medium", or "large" based on the plant's apparent size (string)
- "wateringIntervalDays": an integer — the recommended number of days between watering sessions for this species and size

Example: {"species":"Monstera Deliciosa","size":"medium","wateringIntervalDays":7}`;

const SIZE_RANK = { small: 0, medium: 1, large: 2 };

// Build a checkup prompt that includes the plant's current care data as context.
function buildCheckupPrompt(plant, daysSinceWatered) {
  return `You are a plant care expert. The attached photo shows a "${plant.species}" plant right now. Its current care data in the app is:
- Recorded size: ${plant.size}
- Watering interval: every ${plant.watering_interval_days} day(s)
- Last watered: ${plant.last_watered_date} (${daysSinceWatered} day(s) ago)

Analyze the photo together with this data and respond with ONLY a valid JSON object — no markdown, no explanation. The JSON must contain exactly these fields:
- "size": the plant's current apparent size, one of exactly "small", "medium", or "large"
- "wateringIntervalDays": an integer — the recommended number of days between waterings for this plant going forward, at its current size and condition
- "condition": one of exactly "healthy", "underwatered", or "overwatered", describing the plant's current state
- "pauseWateringDays": an integer >= 0 — if the plant looks overwatered, how many days to hold off ALL watering before resuming the normal schedule; otherwise 0
- "message": one or two short sentences describing what you see and the recommended action
- "homeRemedy": if "condition" is NOT "healthy", a short surprising traditional "grandma's remedy" (a simple home remedy using common household items) the owner can try; if "condition" is "healthy", an empty string ""

Example: {"size":"medium","wateringIntervalDays":5,"condition":"overwatered","pauseWateringDays":7,"message":"Lower leaves are yellowing from too much water. Let the soil dry out for a week, then water every 5 days.","homeRemedy":"Sprinkle a little cinnamon on the soil — it's a natural antifungal that helps roots recover from overwatering."}`;
}

function daysBetween(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - then) / 86400000));
}

function addDaysISO(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  // Format from local components (avoid toISOString's UTC shift).
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

// GET /api/plants?email= — fetch plants for a specific owner
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });

  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('owner_email', email)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/plants — analyze with Gemini, then persist to Supabase
router.post('/', upload.single('photo'), async (req, res) => {
  const { nickname, lastWatered, email } = req.body;
  const photo = req.file;

  if (!photo) return res.status(400).json({ error: 'A plant photo is required' });
  if (!nickname || !lastWatered) {
    return res.status(400).json({ error: 'nickname and lastWatered are required' });
  }
  if (!email) return res.status(400).json({ error: 'email is required' });

  // 1. Send image to Gemini for species/size/watering analysis
  let analysis;
  let rawGeminiText = null;
  try {
    console.log('[Gemini] Sending request — mimeType:', photo.mimetype, 'size:', photo.size, 'bytes');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: photo.mimetype,
                data: photo.buffer.toString('base64'),
              },
            },
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
      config: { responseMimeType: 'application/json' },
    });

    rawGeminiText = response.text;
    console.log('[Gemini] Raw response text:', rawGeminiText);

    analysis = JSON.parse(rawGeminiText);

    if (!analysis.species || !analysis.size || !Number.isInteger(analysis.wateringIntervalDays)) {
      console.error('[Gemini] Unexpected shape:', analysis);
      throw new Error('Unexpected Gemini response shape');
    }

    console.log('[Gemini] Parsed analysis:', analysis);
  } catch (err) {
    console.error('[Gemini] ERROR name    :', err.name);
    console.error('[Gemini] ERROR message :', err.message);
    console.error('[Gemini] ERROR status  :', err.status ?? err.statusCode ?? 'n/a');
    console.error('[Gemini] ERROR details :', err.errorDetails ?? err.body ?? 'n/a');
    console.error('[Gemini] Raw text was  :', rawGeminiText);
    console.error('[Gemini] Full error    :', err);
    return res.status(502).json({ error: 'Failed to analyze plant image. Please try again.' });
  }

  // 2. Upload photo to Supabase Storage
  let imageUrl = null;
  const fileExt = (photo.originalname.split('.').pop() || 'jpg').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: storageError } = await supabase.storage
    .from('plant-images')
    .upload(fileName, photo.buffer, { contentType: photo.mimetype, upsert: false });

  if (storageError) {
    console.error('[Storage] Upload failed (continuing without image):', storageError.message);
  } else {
    const { data: urlData } = supabase.storage.from('plant-images').getPublicUrl(fileName);
    imageUrl = urlData.publicUrl;
    console.log('[Storage] Uploaded:', imageUrl);
  }

  // 3. Persist to Supabase
  const { data, error } = await supabase
    .from('plants')
    .insert({
      nickname,
      last_watered_date: lastWatered,
      species: analysis.species,
      size: analysis.size,
      watering_interval_days: analysis.wateringIntervalDays,
      image_url: imageUrl,
      owner_email: email,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error.message);
    return res.status(500).json({ error: 'Failed to save plant data.' });
  }

  res.status(201).json(data);
});

// DELETE /api/plants/:id — remove plant row and its Storage image
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Fetch image_url first so we can clean up Storage after deletion
  const { data: plant } = await supabase
    .from('plants')
    .select('image_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('plants').delete().eq('id', id);
  if (error) {
    console.error('[Delete] DB error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  // Best-effort Storage cleanup — don't fail the request if this errors
  if (plant?.image_url) {
    const fileName = plant.image_url.split('/').pop();
    const { error: storageError } = await supabase.storage
      .from('plant-images')
      .remove([fileName]);
    if (storageError) console.error('[Delete] Storage cleanup failed:', storageError.message);
  }

  res.status(204).send();
});

// PATCH /api/plants/:id — update editable fields (currently: nickname)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { nickname } = req.body;

  if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
    return res.status(400).json({ error: 'nickname is required' });
  }

  const { data, error } = await supabase
    .from('plants')
    .update({ nickname: nickname.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Rename] DB error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// PATCH /api/plants/:id/water — record that plant was watered today
router.patch('/:id/water', async (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

  // Watering also clears any active "watering pause" (e.g. after an over-watering checkup).
  const { data, error } = await supabase
    .from('plants')
    .update({ last_watered_date: today, water_pause_until: null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Water] DB error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// POST /api/plants/:id/checkup — analyze a fresh photo + care data, then update the plant
router.post('/:id/checkup', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const photo = req.file;

  if (!photo) return res.status(400).json({ error: 'A plant photo is required' });

  // 1. Load the plant for context
  const { data: plant, error: fetchError } = await supabase
    .from('plants')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !plant) {
    return res.status(404).json({ error: 'Plant not found' });
  }

  // 2. Ask Gemini to assess the plant against its current care data
  let analysis;
  let rawGeminiText = null;
  try {
    const daysSinceWatered = daysBetween(plant.last_watered_date);
    console.log('[Checkup] Sending request — plant:', plant.nickname, 'daysSinceWatered:', daysSinceWatered);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: photo.mimetype,
                data: photo.buffer.toString('base64'),
              },
            },
            { text: buildCheckupPrompt(plant, daysSinceWatered) },
          ],
        },
      ],
      config: { responseMimeType: 'application/json' },
    });

    rawGeminiText = response.text;
    console.log('[Checkup] Raw response text:', rawGeminiText);

    analysis = JSON.parse(rawGeminiText);

    const validSize = ['small', 'medium', 'large'].includes(analysis.size);
    const validCondition = ['healthy', 'underwatered', 'overwatered'].includes(analysis.condition);
    if (
      !validSize ||
      !Number.isInteger(analysis.wateringIntervalDays) || analysis.wateringIntervalDays < 1 ||
      !validCondition ||
      !Number.isInteger(analysis.pauseWateringDays) || analysis.pauseWateringDays < 0 ||
      typeof analysis.message !== 'string'
    ) {
      console.error('[Checkup] Unexpected shape:', analysis);
      throw new Error('Unexpected Gemini response shape');
    }

    console.log('[Checkup] Parsed analysis:', analysis);
  } catch (err) {
    console.error('[Checkup] ERROR name    :', err.name);
    console.error('[Checkup] ERROR message :', err.message);
    console.error('[Checkup] Raw text was  :', rawGeminiText);
    return res.status(502).json({ error: 'Failed to analyze plant image. Please try again.' });
  }

  // 3. Derive the outcome status and the DB update (image is NOT stored)
  const previousSize = plant.size;
  const hasGrown = SIZE_RANK[analysis.size] > SIZE_RANK[previousSize];

  let status;
  if (analysis.condition === 'overwatered') status = 'overwatered';
  else if (analysis.condition === 'underwatered') status = 'underwatered';
  else if (hasGrown) status = 'grew';
  else status = 'great';

  const waterPauseUntil = status === 'overwatered' ? addDaysISO(analysis.pauseWateringDays) : null;

  const updatePayload = {
    size: analysis.size,
    watering_interval_days: analysis.wateringIntervalDays,
    water_pause_until: waterPauseUntil,
  };

  const { data: updated, error: updateError } = await supabase
    .from('plants')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[Checkup] DB update error:', updateError.message);
    return res.status(500).json({ error: 'Failed to save checkup results.' });
  }

  res.json({
    plant: updated,
    checkup: {
      status,
      hasGrown,
      previousSize,
      size: analysis.size,
      wateringIntervalDays: analysis.wateringIntervalDays,
      pauseWateringDays: status === 'overwatered' ? analysis.pauseWateringDays : 0,
      waterPauseUntil,
      message: analysis.message,
      // "Grandma's remedy" — surfaced only for unhealthy plants; never stored in the DB.
      homeRemedy: (status === 'underwatered' || status === 'overwatered') && typeof analysis.homeRemedy === 'string'
        ? analysis.homeRemedy
        : '',
    },
  });
});

module.exports = router;
