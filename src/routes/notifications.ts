import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/roles';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notificationReceiver.findMany({
      where: { user_id: req.user!.userId },
      include: {
        notification: {
          include: {
            creator: { include: { profile: true } }
          }
        }
      },
      orderBy: {
        notification: { created_at: 'desc' }
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { title, content, user_ids, send_to_all } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let receivers = [];
    
    if (send_to_all) {
      // Send to all users
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      receivers = allUsers.map(user => ({ user_id: user.id }));
    } else if (user_ids) {
      // Send to specific users
      receivers = user_ids.map((user_id: string) => ({ user_id }));
    } else {
      return res.status(400).json({ error: 'user_ids or send_to_all is required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        created_by: req.user!.userId,
        school_id: req.user!.schoolId || undefined,
        receivers: {
          create: receivers
        }
      },
      include: {
        receivers: { include: { user: { include: { profile: true } } } }
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
