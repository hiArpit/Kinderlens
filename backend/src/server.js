require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Capture routes (Phase 1, Step 1)
const captureRoutes = require('./routes/capture');
app.use('/api/capture', captureRoutes);
const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'kinderlens-backend' });
});

const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exitCode = 1;
});