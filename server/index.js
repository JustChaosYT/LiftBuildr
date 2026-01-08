const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    const txt = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (e) {
    return {};
  }
}

function saveData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/status', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Push data: body { userId: string, items: [any] }
app.post('/sync/push', (req, res) => {
  const { userId, items } = req.body || {};
  if (!userId || !Array.isArray(items)) return res.status(400).json({ ok: false, error: 'userId and items[] required' });
  const data = loadData();
  data[userId] = data[userId] || [];
  const saved = items.map(it => ({ ...it, _serverSavedAt: new Date().toISOString(), _id: `srv_${Date.now()}_${Math.random().toString(36).slice(2,9)}` }));
  data[userId].push(...saved);
  saveData(data);
  res.json({ ok: true, savedCount: saved.length, saved });
});

// Pull data: query userId & since (ISO timestamp optional)
app.get('/sync/pull', (req, res) => {
  const { userId, since } = req.query;
  if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
  const data = loadData();
  const all = data[userId] || [];
  if (!since) return res.json({ ok: true, items: all });
  const sinceT = new Date(since).getTime() || 0;
  const items = all.filter(i => new Date(i._serverSavedAt).getTime() > sinceT);
  res.json({ ok: true, items });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`LiftBuildr sync server running on http://localhost:${PORT}`));
