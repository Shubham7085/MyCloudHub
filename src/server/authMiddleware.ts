import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-cloud-hub';

export interface AuthRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

// Optional auth (for dev/demo fallback)
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = { id: 'user_default', email: 'user@cloudhub.com', name: 'User' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.user = { id: 'user_default', email: 'user@cloudhub.com', name: 'User' };
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
