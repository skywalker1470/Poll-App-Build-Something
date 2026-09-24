const express = require('express');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const POLL_HOST = process.env.POLL_HOST || 'localhost';
const POLL_PORT = process.env.POLL_PORT || '3000';
const VOTE_HOST = process.env.VOTE_HOST || 'localhost';
const VOTE_PORT = process.env.VOTE_PORT || '3001';

app.get('/results/:pollId', async (req, res, next) => {
  try {
    const { pollId } = req.params;

    let poll, votes;
    try {
      const pollRes = await fetch(`http://${POLL_HOST}:${POLL_PORT}/polls/${pollId}`);
      if (!pollRes.ok) return res.status(404).json({ error: 'poll not found' });
      poll = await pollRes.json();

      const voteRes = await fetch(`http://${VOTE_HOST}:${VOTE_PORT}/votes/${pollId}`);
      votes = await voteRes.json();
    } catch (err) {
      return res.status(502).json({ error: 'upstream service unavailable', details: err.message });
    }

    const tally = {};
    for (const option of poll.options) tally[option] = 0;
    for (const vote of votes) {
      if (tally[vote.option] === undefined) tally[vote.option] = 0;
      tally[vote.option] += 1;
    }

    res.json({
      pollId,
      question: poll.question,
      status: poll.status,
      totalVotes: votes.length,
      tally
    });
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'results-service' }));

app.use((err, req, res, next) => {
  console.error('results-service error:', err.message);
  res.status(503).json({ error: 'internal error', details: err.message });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`results-service listening on ${PORT}`));
