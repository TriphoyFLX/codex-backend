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
        const { scope } = req.query; // 'school' or 'all'
        const userSchoolId = req.user.schoolId;
        const whereClause = scope === 'school' && userSchoolId
            ? { school_id: userSchoolId }
            : {};
        const courses = await prisma_1.default.course.findMany({
            where: whereClause,
            include: {
                teacher: { include: { profile: true } },
                school: true,
                stages: {
                    include: { materials: true },
                    orderBy: { order_index: 'asc' }
                },
                enrollments: {
                    include: { user: { include: { profile: true } } }
                },
                assignments: {
                    include: {
                        submissions: {
                            where: { student_id: req.user.userId }
                        }
                    }
                },
                _count: { select: { enrollments: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(courses);
    }
    catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:courseId', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseIdStr },
            include: {
                teacher: { include: { profile: true } },
                school: true,
                stages: {
                    include: {
                        materials: true,
                        progress: {
                            where: { user_id: req.user.userId }
                        }
                    },
                    orderBy: { order_index: 'asc' }
                },
                enrollments: {
                    include: { user: { include: { profile: true } } }
                },
                assignments: {
                    include: {
                        creator: { include: { profile: true } },
                        submissions: {
                            where: { student_id: req.user.userId }
                        }
                    }
                },
                _count: { select: { enrollments: true } }
            }
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    }
    catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, description, image_url, visibility, school_id } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const course = await prisma_1.default.course.create({
            data: {
                title,
                description,
                image_url,
                visibility: visibility || 'SCHOOL',
                teacher_id: req.user.userId,
                school_id: school_id || req.user.schoolId
            }
        });
        res.status(201).json(course);
    }
    catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:courseId/enroll', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const existingEnrollment = await prisma_1.default.courseEnrollment.findUnique({
            where: {
                course_id_user_id: {
                    course_id: courseIdStr,
                    user_id: req.user.userId
                }
            }
        });
        if (existingEnrollment) {
            return res.status(400).json({ error: 'Already enrolled or pending' });
        }
        const enrollment = await prisma_1.default.courseEnrollment.create({
            data: {
                course_id: courseIdStr,
                user_id: req.user.userId,
                status: 'PENDING'
            }
        });
        res.status(201).json(enrollment);
    }
    catch (error) {
        console.error('Enroll error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:courseId/enrollments/:enrollmentId', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId, enrollmentId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const enrollmentIdStr = Array.isArray(enrollmentId) ? enrollmentId[0] : enrollmentId;
        const { status } = req.body;
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseIdStr }
        });
        if (!course || course.teacher_id !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const enrollment = await prisma_1.default.courseEnrollment.update({
            where: { id: enrollmentIdStr },
            data: { status }
        });
        // Create chat if approved
        if (status === 'APPROVED') {
            const existingChat = await prisma_1.default.courseChat.findUnique({
                where: { enrollment_id: enrollmentIdStr }
            });
            if (!existingChat) {
                await prisma_1.default.courseChat.create({
                    data: { enrollment_id: enrollmentIdStr }
                });
            }
        }
        res.json(enrollment);
    }
    catch (error) {
        console.error('Update enrollment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:courseId/enrollments/:enrollmentId', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId, enrollmentId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const enrollmentIdStr = Array.isArray(enrollmentId) ? enrollmentId[0] : enrollmentId;
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseIdStr }
        });
        if (!course || course.teacher_id !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await prisma_1.default.courseEnrollment.delete({
            where: { id: enrollmentIdStr }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Remove participant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:courseId/stages', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const { title, order_index } = req.body;
        const stage = await prisma_1.default.courseStage.create({
            data: {
                course_id: courseIdStr,
                title,
                order_index: order_index || 0
            }
        });
        res.status(201).json(stage);
    }
    catch (error) {
        console.error('Create stage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/stages/:stageId/materials', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { stageId } = req.params;
        const stageIdStr = Array.isArray(stageId) ? stageId[0] : stageId;
        const { type, content_url, content_text } = req.body;
        const material = await prisma_1.default.courseMaterial.create({
            data: {
                stage_id: stageIdStr,
                type,
                content_url,
                content_text
            }
        });
        res.status(201).json(material);
    }
    catch (error) {
        console.error('Create material error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/stages/:stageId/complete', auth_1.authenticate, async (req, res) => {
    try {
        const { stageId } = req.params;
        const stageIdStr = Array.isArray(stageId) ? stageId[0] : stageId;
        const existingProgress = await prisma_1.default.lessonProgress.findUnique({
            where: {
                stage_id_user_id: {
                    stage_id: stageIdStr,
                    user_id: req.user.userId
                }
            }
        });
        if (existingProgress) {
            const progress = await prisma_1.default.lessonProgress.update({
                where: { id: existingProgress.id },
                data: { completed: true, completed_at: new Date() }
            });
            res.json(progress);
        }
        else {
            const progress = await prisma_1.default.lessonProgress.create({
                data: {
                    stage_id: stageIdStr,
                    user_id: req.user.userId,
                    completed: true,
                    completed_at: new Date()
                }
            });
            res.status(201).json(progress);
        }
    }
    catch (error) {
        console.error('Complete lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:courseId/assignments', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        const { title, description } = req.body;
        const assignment = await prisma_1.default.assignment.create({
            data: {
                title,
                description,
                created_by: req.user.userId,
                school_id: req.user.schoolId,
                course_id: courseIdStr
            }
        });
        res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/assignments/:assignmentId/submit', auth_1.authenticate, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignmentIdStr = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
        const { content } = req.body;
        const existingSubmission = await prisma_1.default.assignmentSubmission.findFirst({
            where: {
                assignment_id: assignmentIdStr,
                student_id: req.user.userId
            }
        });
        if (existingSubmission) {
            const submission = await prisma_1.default.assignmentSubmission.update({
                where: { id: existingSubmission.id },
                data: { content }
            });
            res.json(submission);
        }
        else {
            const submission = await prisma_1.default.assignmentSubmission.create({
                data: {
                    assignment_id: assignmentIdStr,
                    student_id: req.user.userId,
                    content
                }
            });
            res.status(201).json(submission);
        }
    }
    catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/assignments/submissions/:submissionId/grade', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submissionIdStr = Array.isArray(submissionId) ? submissionId[0] : submissionId;
        const { grade, feedback } = req.body;
        const submission = await prisma_1.default.assignmentSubmission.findUnique({
            where: { id: submissionIdStr },
            include: { assignment: true }
        });
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        const updatedSubmission = await prisma_1.default.assignmentSubmission.update({
            where: { id: submissionIdStr },
            data: { grade, feedback }
        });
        // Update user stats with XP
        const studentStats = await prisma_1.default.userStats.findUnique({
            where: { user_id: submission.student_id }
        });
        if (studentStats) {
            await prisma_1.default.userStats.update({
                where: { user_id: submission.student_id },
                data: { xp: studentStats.xp + (grade || 0) }
            });
        }
        else {
            await prisma_1.default.userStats.create({
                data: {
                    user_id: submission.student_id,
                    xp: grade || 0
                }
            });
        }
        res.json(updatedSubmission);
    }
    catch (error) {
        console.error('Grade assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
