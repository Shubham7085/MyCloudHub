import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const secret = JWT_SECRET || 'dev-secret';

// DEV DEMO MODE CONFIGURATION
const ENABLE_DEMO_MODE = process.env.NODE_ENV !== 'production';
if (ENABLE_DEMO_MODE) {
  import('bcryptjs').then(async (bcrypt) => {
    const demoPasswordHash = bcrypt.hashSync('Demo@12345', 10);
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@mycloudhub.com',
      password_hash: demoPasswordHash,
      name: 'Demo User (DEV MODE)',
      created_at: new Date()
    };
    
    // Only add if not already present
    const userDoc = await db.collection('users').doc('demo-user-id').get();
    if (!userDoc.exists) {
      await db.collection('users').doc('demo-user-id').set(demoUser);
      
      // Seed some mock drives for the demo user to test the UI
      await db.collection('drives').doc('demo-drive-1').set({
        id: 'demo-drive-1',
        user_id: 'demo-user-id',
        provider: 'google',
        provider_account_id: 'demo-acc-1',
        email: 'demo.personal@gmail.com',
        name: 'Personal Drive',
        used_space: 45 * 1024 * 1024 * 1024,
        total_space: 100 * 1024 * 1024 * 1024,
        status: 'healthy',
        last_sync: new Date(),
        created_at: new Date()
      });
      await db.collection('drives').doc('demo-drive-2').set({
        id: 'demo-drive-2',
        user_id: 'demo-user-id',
        provider: 'onedrive',
        provider_account_id: 'demo-acc-2',
        email: 'demo.work@company.com',
        name: 'Work Drive',
        used_space: 89 * 1024 * 1024 * 1024,
        total_space: 200 * 1024 * 1024 * 1024,
        status: 'healthy',
        last_sync: new Date(),
        created_at: new Date()
      });
    }
  }).catch(console.error);
}

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check existing
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!usersSnapshot.empty) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUserRef = db.collection('users').doc();
    const newUser = {
      id: newUserRef.id,
      name,
      email,
      password_hash: hashedPassword,
    };

    await newUserRef.set(newUser);

    // Create session
    const token = jwt.sign({ userId: newUser.id }, secret, { expiresIn: '7d' });
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      user: { id: newUser.id, name: newUser.name, email: newUser.email } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (usersSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = usersSnapshot.docs[0].data();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
    res.cookie('auth_token', token, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.json({ 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User (Session check)
router.get('/me', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, secret) as any;
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) return res.status(401).json({ error: 'Unauthorized' });
    const user = userDoc.data()!;

    res.json({ 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (usersSnapshot.empty) {
      // Don't reveal if email exists or not
      return res.json({ success: true });
    }
    const user = usersSnapshot.docs[0].data();
    
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await db.collection('passwordResetTokens').add({
      user_id: user.id,
      token: resetToken,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });
    
    // TODO: send via a real email provider
    console.log(`Password reset link: ${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const tokenSnapshot = await db.collection('passwordResetTokens').where('token', '==', token).get();
    if (tokenSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    const tokenData = tokenSnapshot.docs[0].data();
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').doc(tokenData.user_id).update({
      password_hash: hashedPassword
    });
    
    await tokenSnapshot.docs[0].ref.delete();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile Update
router.patch('/profile', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, secret) as any;
    const { name, timezone, language, username } = req.body;
    
    await db.collection('users').doc(decoded.userId).update({
      name,
      timezone,
      language,
      username
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
  
