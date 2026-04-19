import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/global', authenticate, async (req: Request, res: Response) => {
  try {
    const leaderboard = await prisma.userStats.findMany({
      include: {
        user: {
          include: { profile: true }
        }
      },
      orderBy: [
        { xp: 'desc' },
        { coins: 'desc' }
      ],
      take: 100
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/school', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user!.schoolId) {
      return res.status(400).json({ error: 'User is not associated with a school' });
    }

    const leaderboard = await prisma.userStats.findMany({
      where: {
        user: { school_id: req.user!.schoolId }
      },
      include: {
        user: {
          include: { profile: true }
        }
      },
      orderBy: [
        { xp: 'desc' },
        { coins: 'desc' }
      ],
      take: 100
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Get school leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await prisma.userStats.findUnique({
      where: { user_id: req.user!.userId },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    if (!stats) {
      const newStats = await prisma.userStats.create({
        data: {
          user_id: req.user!.userId
        },
        include: {
          user: {
            include: { profile: true }
          }
        }
      });
      return res.json(newStats);
    }

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { xp, coins, level } = req.body;

    const stats = await prisma.userStats.upsert({
      where: { user_id: req.user!.userId },
      update: {
        xp: xp || undefined,
        coins: coins || undefined,
        level: level || undefined
      },
      create: {
        user_id: req.user!.userId,
        xp: xp || 0,
        coins: coins || 0,
        level: level || 1
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Update user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
