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

// GET /api/plants — fetch all plants ordered newest first
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/plants — analyze with Gemini, then persist to Supabase
router.post('/', upload.single('photo'), async (req, res) => {
  const { nickname, lastWatered } = req.body;
  const photo = req.file;

  if (!photo) return res.status(400).json({ error: 'A plant photo is required' });
  if (!nickname || !lastWatered) {
    return res.status(400).json({ error: 'nickname and lastWatered are required' });
  }

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

  // 2. Persist to Supabase (image_url left null — wire up Supabase Storage when ready)
  const { data, error } = await supabase
    .from('plants')
    .insert({
      nickname,
      last_watered_date: lastWatered,
      species: analysis.species,
      size: analysis.size,
      watering_interval_days: analysis.wateringIntervalDays,
      image_url: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error.message);
    return res.status(500).json({ error: 'Failed to save plant data.' });
  }

  res.status(201).json(data);
});

module.exports = router;
