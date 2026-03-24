const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Start an Apify actor run
app.post('/api/scan', async (req, res) => {
  const { zip } = req.body;
  if (!zip || zip.length !== 5) return res.status(400).json({ error: 'Invalid ZIP' });

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/bluebird~home-depot-scraper/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: 'clearance',
          zipCode: zip,
          maxItems: 40,
          country: 'US'
        })
      }
    );
    const data = await response.json();
    if (!data.data) return res.status(500).json({ error: 'Failed to start scan', detail: data });
    res.json({ runId: data.data.id, datasetId: data.data.defaultDatasetId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check run status
app.get('/api/status/:runId', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${req.params.runId}?token=${APIFY_TOKEN}`
    );
    const data = await response.json();
    res.json({ status: data.data.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get results from dataset
app.get('/api/results/:datasetId', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${req.params.datasetId}/items?token=${APIFY_TOKEN}&limit=100`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DealRadar server running on port ${PORT}`));
