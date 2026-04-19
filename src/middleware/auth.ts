import { Request, Response, NextFunction } from 'express';
import { getUserFromRequest } from '../lib/auth';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const user = getUserFromRequest(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};
