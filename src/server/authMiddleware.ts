import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

// TEMPORARY: Login/signup disabled for maintenance.
// This bypasses real authentication and attaches a guest identity so
// backend routes keep working (no 401 errors) without a real session.
// A guest account has no drives/files of its own, so the dashboard will
// simply show empty states rather than errors.
//
// To re-enable auth later, restore the original JWT + Firestore check
// (verify the auth_token cookie, look up the user in Firestore, and
// fall back to 401 Unauthorized if invalid).
const GUEST_USER = {
  id: 'guest-user',
  name: 'Guest User',
  email: 'guest@mycloudhub.com'
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  req.user = GUEST_USER;
  next();
};
