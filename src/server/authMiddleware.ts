// src/server/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-cloud-hub';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Demo/Development fallback user so it doesn't throw 500 when unauthenticated
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

