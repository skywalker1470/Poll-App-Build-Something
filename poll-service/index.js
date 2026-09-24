const express = require('express');
const { ObjectId } = require('mongodb');
const { connect } = require('./db');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const NOTIFICATION_HOST = process.env.NOTIFICATION_HOST || 'localhost';
const NOTIFICATION_PORT = process.env.NOTIFICATION_PORT || '3003';

app.post('/polls', async (req, res, next) => {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'question and at least 2 options are required' });
    }
    const db = await connect();
    const poll = {
      question,
      options,
      status: 'open',
      createdAt: new Date()
    };
    const result = await db.collection('polls').insertOne(poll);
    res.status(201).json({ id: result.insertedId, ...poll });
  } catch (err) {
    next(err);
  }
});

app.get('/polls', async (req, res, next) => {
  try {
    const db = await connect();
    const polls = await db.collection('polls').find().sort({ createdAt: -1 }).toArray();
    res.json(polls);
  } catch (err) {
    next(err);
  }
});

app.get('/polls/:id', async (req, res, next) => {
  try {
    const db = await connect();
    const poll = await db.collection('polls').findOne({ _id: new ObjectId(req.params.id) });
    if (!poll) return res.status(404).json({ error: 'poll not found' });
    res.json(poll);
  } catch (err) {
    next(err);
  }
});

app.post('/polls/:id/close', async (req, res, next) => {
  try {
    const db = await connect();
    const id = new ObjectId(req.params.id);
    const poll = await db.collection('polls').findOne({ _id: id });
    if (!poll) return res.status(404).json({ error: 'poll not found' });

    await db.collection('polls').updateOne({ _id: id }, { $set: { status: 'closed' } });

    try {
      await fetch(`http://${NOTIFICATION_HOST}:${NOTIFICATION_PORT}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'poll_closed', pollId: req.params.id, question: poll.question })
      });
    } catch (err) {
      console.log('WARNING: could not reach notification-service:', err.message);
    }

    res.json({ id: req.params.id, status: 'closed' });
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'poll-service' }));

app.use((err, req, res, next) => {
  console.error('poll-service error:', err.message);
  res.status(503).json({ error: 'internal error', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`poll-service listening on ${PORT}`));
