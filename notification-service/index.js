const express = require('express');

const app = express();
app.use(express.json());

const notifications = [];

app.post('/notifications', (req, res) => {
  const { event, pollId, question } = req.body;
  const notification = { event, pollId, question, receivedAt: new Date() };
  notifications.push(notification);
  console.log(`[notification] ${event} for poll ${pollId} ("${question}")`);
  res.status(201).json(notification);
});

app.get('/notifications', (req, res) => {
  res.json(notifications);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`notification-service listening on ${PORT}`));
