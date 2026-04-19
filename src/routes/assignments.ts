import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../middleware/roles';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        course_id: null, // Only non-course assignments
      },
      include: {
        creator: { include: { profile: true } },
        school: true,
        submissions: {
          include: {
            student: { include: { profile: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { title, description, school_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        created_by: req.user!.userId,
        school_id: school_id || req.user!.schoolId
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:assignmentId/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const assignmentIdStr = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignment_id: assignmentIdStr,
        student_id: req.user!.userId,
        content
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/submissions/:submissionId/grade', authenticate, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submissionIdStr = Array.isArray(submissionId) ? submissionId[0] : submissionId;
    const { grade, feedback } = req.body;

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionIdStr },
      data: { grade, feedback }
    });

    // Update user stats with XP if grade is provided
    if (grade !== null && grade !== undefined) {
      const studentStats = await prisma.userStats.findUnique({
        where: { user_id: submission.student_id }
      });

      if (studentStats) {
        await prisma.userStats.update({
          where: { user_id: submission.student_id },
          data: { xp: studentStats.xp + grade }
        });
      } else {
        await prisma.userStats.create({
          data: {
            user_id: submission.student_id,
            xp: grade
          }
        });
      }
    }

    res.json(submission);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
