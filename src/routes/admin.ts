import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// Get all users
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true, school: true, stats: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    
    await prisma.user.delete({ where: { id: userIdStr } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change user role
router.patch('/users/:userId/role', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id: userIdStr },
      data: { role }
    });

    res.json(user);
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/posts/:postId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    
    await prisma.post.delete({ where: { id: postIdStr } });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
router.delete('/courses/:courseId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
    
    await prisma.course.delete({ where: { id: courseIdStr } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete assignment
router.delete('/assignments/:assignmentId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const assignmentIdStr = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
    
    await prisma.assignment.delete({ where: { id: assignmentIdStr } });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
router.delete('/events/:eventId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    
    await prisma.event.delete({ where: { id: eventIdStr } });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete school
router.delete('/schools/:schoolId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const schoolIdStr = Array.isArray(schoolId) ? schoolId[0] : schoolId;
    
    await prisma.school.delete({ where: { id: schoolIdStr } });
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
