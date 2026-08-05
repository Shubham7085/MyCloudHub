import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const secret = JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      const demoUserDoc = await db.collection('users').doc('demo-user-id').get();
      if (demoUserDoc.exists) {
        req.user = demoUserDoc.data();
        return next();
      }
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      if (process.env.NODE_ENV !== 'production') {
        const demoUserDoc = await db.collection('users').doc('demo-user-id').get();
        if (demoUserDoc.exists) {
          req.user = demoUserDoc.data();
          return next();
        }
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = userDoc.data();
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const demoUserDoc = await db.collection('users').doc('demo-user-id').get();
      if (demoUserDoc.exists) {
        req.user = demoUserDoc.data();
        return next();
      }
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
};
