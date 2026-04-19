import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: true,
        stats: true,
        school: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { username, avatar_url, bio, grade, auto_generated, school_id } = req.body;

    // Update school if provided
    if (school_id) {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { school_id }
      });
    }

    const profile = await prisma.profile.upsert({
      where: { user_id: req.user!.userId },
      update: {
        username,
        avatar_url,
        bio,
        grade,
        auto_generated
      },
      create: {
        user_id: req.user!.userId,
        username,
        avatar_url,
        bio,
        grade,
        auto_generated: auto_generated || false
      }
    });

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query } },
          { profile: { username: { contains: query } } }
        ]
      },
      include: { profile: true },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const stats = await prisma.userStats.findUnique({
      where: { user_id: req.user!.userId }
    });
    res.json(stats || { xp: 0, coins: 0, level: 1 });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId/public', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const user = await prisma.user.findUnique({
      where: { id: userIdStr },
      include: {
        profile: true,
        school: true,
        stats: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const stats = await prisma.userStats.findUnique({
      where: { user_id: userIdStr }
    });
    res.json(stats || { xp: 0, coins: 0, level: 1 });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/social', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get total likes on user's posts
    const posts = await prisma.post.findMany({
      where: { author_id: userId },
      select: { id: true }
    });

    const postIds = posts.map(p => p.id);

    const totalLikes = await prisma.postLike.count({
      where: { post_id: { in: postIds } }
    });

    const totalComments = await prisma.comment.count({
      where: { post_id: { in: postIds } }
    });

    // Get current course (most recent enrollment)
    const currentCourse = await prisma.courseEnrollment.findFirst({
      where: { user_id: userId },
      include: {
        course: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      totalLikes,
      totalComments,
      currentCourse: currentCourse?.course || null
    });
  } catch (error) {
    console.error('Get social stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
