"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
const router = (0, express_1.Router)();
// Get all users
router.get('/users', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            include: { profile: true, school: true, stats: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete user
router.delete('/users/:userId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        await prisma_1.default.user.delete({ where: { id: userIdStr } });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Change user role
router.patch('/users/:userId/role', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const { role } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: userIdStr },
            data: { role }
        });
        res.json(user);
    }
    catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete post
router.delete('/posts/:postId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { postId } = req.params;
        const postIdStr = Array.isArray(postId) ? postId[0] : postId;
        await prisma_1.default.post.delete({ where: { id: postIdStr } });
        res.json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete course
router.delete('/courses/:courseId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;
        await prisma_1.default.course.delete({ where: { id: courseIdStr } });
        res.json({ message: 'Course deleted successfully' });
    }
    catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete assignment
router.delete('/assignments/:assignmentId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignmentIdStr = Array.isArray(assignmentId) ? assignmentId[0] : assignmentId;
        await prisma_1.default.assignment.delete({ where: { id: assignmentIdStr } });
        res.json({ message: 'Assignment deleted successfully' });
    }
    catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete event
router.delete('/events/:eventId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
        await prisma_1.default.event.delete({ where: { id: eventIdStr } });
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete school
router.delete('/schools/:schoolId', auth_1.authenticate, admin_1.requireAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolIdStr = Array.isArray(schoolId) ? schoolId[0] : schoolId;
        await prisma_1.default.school.delete({ where: { id: schoolIdStr } });
        res.json({ message: 'School deleted successfully' });
    }
    catch (error) {
        console.error('Delete school error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
