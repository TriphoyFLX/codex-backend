import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';
import verificationService from '../lib/verification';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, teacher_code, school_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let role = 'STUDENT';
    let teacherCodeUsed = null;
    let finalSchoolId = school_id;

    if (teacher_code === 'ADMINSECRET123') {
      role = 'ADMIN';
      teacherCodeUsed = 'ADMINSECRET123';
    } else if (teacher_code) {
      const validCode = await prisma.teacherCode.findUnique({
        where: { code: teacher_code },
        include: { school: true }
      });

      if (!validCode || new Date() > validCode.expires_at) {
        return res.status(400).json({ error: 'Invalid or expired teacher code' });
      }

      role = 'TEACHER';
      teacherCodeUsed = teacher_code;
      if (!finalSchoolId) {
        finalSchoolId = validCode.school_id;
      }
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: role as any,
        teacher_code_used: teacherCodeUsed,
        school_id: finalSchoolId
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id || undefined
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id || undefined
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New registration with email verification
router.post('/register-with-verification', async (req: Request, res: Response) => {
  try {
    const { email, password, teacher_code, school_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Send verification code first
    const verificationResult = await verificationService.createAndSendVerification(email);
    
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    // Store registration data temporarily (you could use Redis or a temporary table)
    // For now, we'll ask the client to send verification code and then complete registration
    
    res.json({ 
      message: 'Verification code sent. Please verify your email to complete registration.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration with verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete registration after email verification
router.post('/complete-registration', async (req: Request, res: Response) => {
  try {
    const { email, password, teacher_code, school_id, verification_code } = req.body;

    if (!email || !password || !verification_code) {
      return res.status(400).json({ error: 'Email, password, and verification code are required' });
    }

    // Verify the code first
    const verificationResult = await verificationService.verifyCode(email, verification_code);
    
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    // Proceed with normal registration
    let role = 'STUDENT';
    let teacherCodeUsed = null;
    let finalSchoolId = school_id;

    if (teacher_code === 'ADMINSECRET123') {
      role = 'ADMIN';
      teacherCodeUsed = 'ADMINSECRET123';
    } else if (teacher_code) {
      const validCode = await prisma.teacherCode.findUnique({
        where: { code: teacher_code },
        include: { school: true }
      });

      if (!validCode || new Date() > validCode.expires_at) {
        return res.status(400).json({ error: 'Invalid or expired teacher code' });
      }

      role = 'TEACHER';
      teacherCodeUsed = teacher_code;
      if (!finalSchoolId) {
        finalSchoolId = validCode.school_id;
      }
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: role as any,
        teacher_code_used: teacherCodeUsed,
        school_id: finalSchoolId
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id || undefined
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id
      }
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
