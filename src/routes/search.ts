import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const [users, courses, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q } },
            { profile: { username: { contains: q } } }
          ]
        },
        include: { profile: true },
        take: 10
      }),
      prisma.course.findMany({
        where: {
          title: { contains: q }
        },
        include: {
          teacher: { include: { profile: true } }
        },
        take: 10
      }),
      prisma.post.findMany({
        where: {
          content: { contains: q }
        },
        include: {
          author: { include: { profile: true } }
        },
        take: 10
      })
    ]);

    res.json({ users, courses, posts });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
