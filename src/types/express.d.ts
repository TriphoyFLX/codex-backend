import { JWTPayload } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
