const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'XRL backend is live', timestamp: new Date().toISOString() });
});

// Routes
app.get('/', (req, res) => {
  res.send('XRL backend is live');
});

// Proxy endpoints for n8n webhooks
app.post('/api/n8n', async (req, res) => {
  try {
    const response = await fetch('https://shooky5.app.n8n.cloud/webhook/xrl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json().catch(() => ({}));
    res.json(data);
  } catch (error) {
    console.error('n8n proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy to n8n' });
  }
});

// Proxy endpoint for Crunchbase webhook
app.post('/api/crunchbase', async (req, res) => {
  try {
    const response = await fetch('https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json().catch(() => ({}));
    res.json(data);
  } catch (error) {
    console.error('crunchbase proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy to crunchbase' });
  }
});

// Proxy endpoint for XRL_DataToPlatform webhook
app.post('/api/xrl-data-to-platform', async (req, res) => {
  try {
    const response = await fetch('https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json().catch(() => ({}));
    res.json(data);
  } catch (error) {
    console.error('xrl-data-to-platform proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy to xrl-data-to-platform' });
  }
});

// Proxy endpoint for fetching results
app.get('/api/results/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const response = await fetch(`https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform?runId=${runId}`);
    const data = await response.json().catch(() => ({}));
    res.json(data);
  } catch (error) {
    console.error('results proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

