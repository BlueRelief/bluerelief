import express from 'express';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/logger';
import indexRoutes from './routes/index';
import emailRoutes from './routes/email';

// Load environment variables
dotenv.config();

// Log startup info
const PORT = process.env.PORT || 3002;
const hasApiKey = !!process.env.RESEND_API_KEY;

if (!hasApiKey) {
  console.warn('⚠️  Warning: RESEND_API_KEY not found. Email sending will fail.');
  console.warn('    Make sure your .env file is loaded or RESEND_API_KEY is set.');
}

const app: express.Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/', indexRoutes);
app.use('/', emailRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
