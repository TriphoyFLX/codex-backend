import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/roles';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { scope } = req.query; // 'school' or 'all'
    const userSchoolId = req.user!.schoolId;

    const whereClause = scope === 'school' && userSchoolId 
      ? { school_id: userSchoolId }
      : {};

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        creator: { include: { profile: true } },
        school: true,
        participants: {
          include: {
            user: { include: { profile: true } }
          }
        },
        _count: { select: { participants: true } }
      },
      orderBy: { date: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

    const event = await prisma.event.findUnique({
      where: { id: eventIdStr },
      include: {
        creator: { include: { profile: true } },
        school: true,
        participants: {
          include: {
            user: { include: { profile: true } }
          }
        },
        _count: { select: { participants: true } }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { title, description, image_url, visibility, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        image_url,
        visibility: visibility || 'SCHOOL',
        school_id: req.user!.schoolId!,
        created_by: req.user!.userId,
        date: new Date(date)
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:eventId/join', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

    const participant = await prisma.eventParticipant.create({
      data: {
        event_id: eventIdStr,
        user_id: req.user!.userId
      }
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:eventId/join', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

    await prisma.eventParticipant.deleteMany({
      where: {
        event_id: eventIdStr,
        user_id: req.user!.userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
