import { Router, Request, Response } from 'express';
import verificationService from '../lib/verification';

const router = Router();

// Send verification code
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await verificationService.createAndSendVerification(email);
    
    if (result.success) {
      res.json({ message: 'Verification code sent successfully' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify code
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const result = await verificationService.verifyCode(email, code);
    
    if (result.success) {
      res.json({ message: 'Email verified successfully' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean up expired verifications (admin endpoint)
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    await verificationService.cleanupExpiredVerifications();
    res.json({ message: 'Expired verifications cleaned up' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
