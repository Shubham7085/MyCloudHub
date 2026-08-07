// src/server/drives.ts
import { Router } from 'express';
import { dbOps } from './db';
import { authenticateToken } from './authMiddleware';

const router = Router();

// Fetch drives for logged in user
router.get('/', authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const drives = dbOps.getDrivesByUserId(userId);
    res.json(drives || []);
  } catch (error) {
    console.error('Error fetching drives:', error);
    res.status(500).json({ message: 'Failed to fetch drives' });
  }
});

// Drive Connection Route
router.post('/connect-demo', authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.body;

    const newDrive = {
      id: `${provider || 'google'}_${Date.now()}`,
      user_id: userId,
      provider: provider || 'google',
      name: `${provider ? provider.toUpperCase() : 'GOOGLE'} DRIVE`,
      email: req.user.email || 'user@cloudhub.com',
      total_space: 15 * 1024 * 1024 * 1024, // 15 GB
      used_space: 2 * 1024 * 1024 * 1024,  // 2 GB
      access_token: 'demo_token_' + Date.now(),
      refresh_token: 'demo_refresh_' + Date.now()
    };

    dbOps.saveDrive(newDrive);
    res.json({ success: true, drive: newDrive });
  } catch (error) {
    console.error('Error connecting drive:', error);
    res.status(500).json({ message: 'Failed to connect drive' });
  }
});

export default router;

