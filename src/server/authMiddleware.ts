import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// SECURITY FIX: Strict JWT_SECRET check — no fallback, no hardcoded secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it in your .env or hosting dashboard before starting the server.');
}

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

// Optional auth — does NOT set a dummy user if token is missing or invalid
// Routes that need optional auth must handle req.user === undefined themselves
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.user = undefined;
    } else {
      req.user = user;
    }
    next();
  });
};

// Strict auth (for protected routes like /api/drives)
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.userId, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
