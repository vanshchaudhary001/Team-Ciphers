import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import employeeRouter from './routes/employee.js';
import unstickRouter from './routes/unstick.js';
import hrRouter from './routes/hr.js';
import ownerRouter from './routes/owner.js';
import notificationsRouter from './routes/notifications.js';
import helpRouter from './routes/help.js';
import aiRouter from './routes/ai.js';
import adminRouter from './routes/admin.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For local dev flexibility
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
}));

app.use(express.json());

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'start-smart-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Versioned API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/me', employeeRouter);
app.use('/api/v1/tasks', employeeRouter);
app.use('/api/v1/unstick', unstickRouter);
app.use('/api/v1/blockers', unstickRouter);
app.use('/api/v1/hr', hrRouter);
app.use('/api/v1/owner', ownerRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/help', helpRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/admin', adminRouter);

// Centralized error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

// 404 handler for API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Start Smart API server listening on http://localhost:${PORT}`);
  logger.info(`👉 API Health check: http://localhost:${PORT}/api/v1/health`);
});

export default app;
