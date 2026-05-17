const express = require('express');
const cors = require('cors');
require('dotenv').config();

const plantsRouter = require('./routes/plants');
require('./scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Plant Care API is running' });
});

app.use('/api/plants', plantsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
