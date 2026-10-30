require('dotenv').config();

const { connectDatabase } = require('./config/db');
const app = require('./app');
const PORT = process.env.PORT || 5000;

const validateProductionConfig = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['MONGODB_URI', 'PARENT_SESSION_SECRET', 'FRONTEND_ORIGIN'];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (process.env.PARENT_SESSION_SECRET.length < 32) {
    throw new Error('PARENT_SESSION_SECRET must be at least 32 characters in production.');
  }
};

const startServer = async () => {
  validateProductionConfig();
  await connectDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}; shutting down.`);
    server.close(async () => {
      await require('./config/db').disconnectDatabase();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exitCode = 1;
});