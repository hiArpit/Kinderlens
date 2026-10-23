const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const captureRoutes = require('./routes/capture');
app.use('/api/capture', captureRoutes);
const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);
const parentRoutes = require('./routes/parent');
app.use('/api/parent', parentRoutes);
const accountRoutes = require('./routes/account');
app.use('/api/account', accountRoutes);
const wonderListRoutes = require('./routes/wonderList');
app.use('/api/wonder-list', wonderListRoutes);
const quizRoutes = require('./routes/quiz');
app.use('/api/quiz', quizRoutes);
const storyRoutes = require('./routes/story');
app.use('/api/story', storyRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'kinderlens-backend' });
});

module.exports = app;
