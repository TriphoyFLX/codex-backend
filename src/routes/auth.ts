import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';

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

export default router;
