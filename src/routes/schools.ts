import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/roles';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    
    const schools = await prisma.school.findMany({
      where: city ? { city: city as string } : undefined,
      orderBy: { created_at: 'desc' }
    });

    res.json(schools);
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Name and city are required' });
    }

    const school = await prisma.school.create({
      data: { name, city }
    });

    res.status(201).json(school);
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/teacher-codes', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { school_id, expires_in_days } = req.body;

    if (!school_id) {
      return res.status(400).json({ error: 'School ID is required' });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + (expires_in_days || 30));

    const teacherCode = await prisma.teacherCode.create({
      data: {
        code,
        school_id,
        created_by: req.user!.userId,
        expires_at
      }
    });

    res.status(201).json(teacherCode);
  } catch (error) {
    console.error('Create teacher code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/teacher-codes', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const codes = await prisma.teacherCode.findMany({
      where: { created_by: req.user!.userId },
      include: { school: true },
      orderBy: { created_at: 'desc' }
    });

    res.json(codes);
  } catch (error) {
    console.error('Get teacher codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
