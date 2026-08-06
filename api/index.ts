import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../src/server/auth.js';
import drivesRoutes from '../src/server/drives.js';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/drives', drivesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;

