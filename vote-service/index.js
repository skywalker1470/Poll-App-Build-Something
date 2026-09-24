const express = require('express');
const { connect } = require('./db');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const POLL_HOST = process.env.POLL_HOST || 'localhost';
const POLL_PORT = process.env.POLL_PORT || '3000';

app.post('/votes', async (req, res, next) => {
  try {
    const { pollId, option, voterId } = req.body;
    if (!pollId || !option || !voterId) {
      return res.status(400).json({ error: 'pollId, option, and voterId are required' });
    }

    let poll;
    try {
      const pollRes = await fetch(`http://${POLL_HOST}:${POLL_PORT}/polls/${pollId}`);
      if (!pollRes.ok) return res.status(404).json({ error: 'poll not found' });
      poll = await pollRes.json();
    } catch (err) {
      return res.status(502).json({ error: 'could not reach poll-service', details: err.message });
    }

    if (poll.status !== 'open') {
      return res.status(409).json({ error: 'poll is closed' });
    }
    if (!poll.options.includes(option)) {
      return res.status(400).json({ error: 'invalid option for this poll' });
    }

    const db = await connect();

    const existing = await db.collection('votes').findOne({ pollId, voterId });
    if (existing) {
      return res.status(409).json({ error: 'voter has already voted on this poll' });
    }

    const vote = { pollId, option, voterId, castAt: new Date() };
    await db.collection('votes').insertOne(vote);
    res.status(201).json(vote);
  } catch (err) {
    next(err);
  }
});

app.get('/votes/:pollId', async (req, res, next) => {
  try {
    const db = await connect();
    const votes = await db.collection('votes').find({ pollId: req.params.pollId }).toArray();
    res.json(votes);
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'vote-service' }));

app.use((err, req, res, next) => {
  console.error('vote-service error:', err.message);
  res.status(503).json({ error: 'internal error', details: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`vote-service listening on ${PORT}`));
