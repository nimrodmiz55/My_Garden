const express = require('express');
const cors = require('cors');
require('dotenv').config();

const plantsRouter = require('./routes/plants');
const internalRouter = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Plant Care API is running' });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('ok');
});

app.use('/api/plants', plantsRouter);
app.use('/api/internal', internalRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
