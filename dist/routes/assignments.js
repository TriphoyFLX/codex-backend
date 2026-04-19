"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const roles_1 = require("../middleware/roles");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const assignments = await prisma_1.default.assignment.findMany({
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
    }
    catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, description, school_id } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const assignment = await prisma_1.default.assignment.create({
            data: {
                title,
                description,
                created_by: req.user.userId,
                school_id: school_id || req.user.schoolId
            }
        });
        res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:assignmentId/submit', auth_1.authenticate, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignmentIdStr = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const submission = await prisma_1.default.assignmentSubmission.create({
            data: {
                assignment_id: assignmentIdStr,
                student_id: req.user.userId,
                content
            }
        });
        res.status(201).json(submission);
    }
    catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/submissions/:submissionId/grade', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submissionIdStr = Array.isArray(submissionId) ? submissionId[0] : submissionId;
        const { grade, feedback } = req.body;
        const submission = await prisma_1.default.assignmentSubmission.update({
            where: { id: submissionIdStr },
            data: { grade, feedback }
        });
        // Update user stats with XP if grade is provided
        if (grade !== null && grade !== undefined) {
            const studentStats = await prisma_1.default.userStats.findUnique({
                where: { user_id: submission.student_id }
            });
            if (studentStats) {
                await prisma_1.default.userStats.update({
                    where: { user_id: submission.student_id },
                    data: { xp: studentStats.xp + grade }
                });
            }
            else {
                await prisma_1.default.userStats.create({
                    data: {
                        user_id: submission.student_id,
                        xp: grade
                    }
                });
            }
        }
        res.json(submission);
    }
    catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
