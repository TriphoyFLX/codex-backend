"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/global', auth_1.authenticate, async (req, res) => {
    try {
        const leaderboard = await prisma_1.default.userStats.findMany({
            include: {
                user: {
                    include: { profile: true }
                }
            },
            orderBy: [
                { xp: 'desc' },
                { coins: 'desc' }
            ],
            take: 100
        });
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Get global leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/school', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user.schoolId) {
            return res.status(400).json({ error: 'User is not associated with a school' });
        }
        const leaderboard = await prisma_1.default.userStats.findMany({
            where: {
                user: { school_id: req.user.schoolId }
            },
            include: {
                user: {
                    include: { profile: true }
                }
            },
            orderBy: [
                { xp: 'desc' },
                { coins: 'desc' }
            ],
            take: 100
        });
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Get school leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const stats = await prisma_1.default.userStats.findUnique({
            where: { user_id: req.user.userId },
            include: {
                user: {
                    include: { profile: true }
                }
            }
        });
        if (!stats) {
            const newStats = await prisma_1.default.userStats.create({
                data: {
                    user_id: req.user.userId
                },
                include: {
                    user: {
                        include: { profile: true }
                    }
                }
            });
            return res.json(newStats);
        }
        res.json(stats);
    }
    catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/me', auth_1.authenticate, async (req, res) => {
    try {
        const { xp, coins, level } = req.body;
        const stats = await prisma_1.default.userStats.upsert({
            where: { user_id: req.user.userId },
            update: {
                xp: xp || undefined,
                coins: coins || undefined,
                level: level || undefined
            },
            create: {
                user_id: req.user.userId,
                xp: xp || 0,
                coins: coins || 0,
                level: level || 1
            },
            include: {
                user: {
                    include: { profile: true }
                }
            }
        });
        res.json(stats);
    }
    catch (error) {
        console.error('Update user stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
