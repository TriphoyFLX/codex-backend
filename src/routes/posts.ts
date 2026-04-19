import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { include: { profile: true } },
        likes: true,
        comments: {
          include: { author: { include: { profile: true } } },
          orderBy: { created_at: 'asc' }
        },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { content, image_url } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await prisma.post.create({
      data: {
        content,
        image_url,
        author_id: req.user!.userId
      },
      include: {
        author: { include: { profile: true } }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:postId/like', authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;

    const existing = await prisma.postLike.findUnique({
      where: {
        user_id_post_id: {
          user_id: req.user!.userId,
          post_id: postIdStr
        }
      }
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { id: existing.id }
      });
      return res.json({ liked: false });
    }

    await prisma.postLike.create({
      data: {
        user_id: req.user!.userId,
        post_id: postIdStr
      }
    });

    res.json({ liked: true });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:postId/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        post_id: postIdStr,
        author_id: req.user!.userId,
        content
      },
      include: {
        author: { include: { profile: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
