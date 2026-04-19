import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/roles';

const router = Router();

router.get('/levels', authenticate, async (req: Request, res: Response) => {
  try {
    const levels = await prisma.practiceLevel.findMany({
      orderBy: { difficulty: 'asc' }
    });

    res.json(levels);
  } catch (error) {
    console.error('Get practice levels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/levels', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty } = req.body;

    if (!title || !difficulty) {
      return res.status(400).json({ error: 'Title and difficulty are required' });
    }

    const level = await prisma.practiceLevel.create({
      data: {
        title,
        description,
        created_by: req.user!.userId,
        difficulty
      }
    });

    res.status(201).json(level);
  } catch (error) {
    console.error('Create practice level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.practiceSession.findMany({
      where: { user_id: req.user!.userId },
      include: { level: true },
      orderBy: { created_at: 'desc' }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get practice sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const { level_id } = req.body;

    if (!level_id) {
      return res.status(400).json({ error: 'Level ID is required' });
    }

    const session = await prisma.practiceSession.create({
      data: {
        user_id: req.user!.userId,
        level_id
      },
      include: { level: true }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create practice session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/sessions/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    const { balance, progress, completed } = req.body;

    const session = await prisma.practiceSession.update({
      where: { id: sessionIdStr },
      data: {
        balance,
        progress,
        completed
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Update practice session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
