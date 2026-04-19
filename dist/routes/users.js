"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        const { username, avatar_url, bio, grade, auto_generated, school_id } = req.body;
        // Update school if provided
        if (school_id) {
            await prisma_1.default.user.update({
                where: { id: req.user.userId },
                data: { school_id }
            });
        }
        const profile = await prisma_1.default.profile.upsert({
            where: { user_id: req.user.userId },
            update: {
                username,
                avatar_url,
                bio,
                grade,
                auto_generated
            },
            create: {
                user_id: req.user.userId,
                username,
                avatar_url,
                bio,
                grade,
                auto_generated: auto_generated || false
            }
        });
        res.json(profile);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/search', auth_1.authenticate, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const stats = await prisma_1.default.userStats.findUnique({
            where: { user_id: req.user.userId }
        });
        res.json(stats || { xp: 0, coins: 0, level: 1 });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:userId/public', async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const user = await prisma_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const stats = await prisma_1.default.userStats.findUnique({
            where: { user_id: userIdStr }
        });
        res.json(stats || { xp: 0, coins: 0, level: 1 });
    }
    catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/me/social', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Get total likes on user's posts
        const posts = await prisma_1.default.post.findMany({
            where: { author_id: userId },
            select: { id: true }
        });
        const postIds = posts.map(p => p.id);
        const totalLikes = await prisma_1.default.postLike.count({
            where: { post_id: { in: postIds } }
        });
        const totalComments = await prisma_1.default.comment.count({
            where: { post_id: { in: postIds } }
        });
        // Get current course (most recent enrollment)
        const currentCourse = await prisma_1.default.courseEnrollment.findFirst({
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
    }
    catch (error) {
        console.error('Get social stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
