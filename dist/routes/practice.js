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
router.get('/levels', auth_1.authenticate, async (req, res) => {
    try {
        const levels = await prisma_1.default.practiceLevel.findMany({
            orderBy: { difficulty: 'asc' }
        });
        res.json(levels);
    }
    catch (error) {
        console.error('Get practice levels error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/levels', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, description, difficulty } = req.body;
        if (!title || !difficulty) {
            return res.status(400).json({ error: 'Title and difficulty are required' });
        }
        const level = await prisma_1.default.practiceLevel.create({
            data: {
                title,
                description,
                created_by: req.user.userId,
                difficulty
            }
        });
        res.status(201).json(level);
    }
    catch (error) {
        console.error('Create practice level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/sessions', auth_1.authenticate, async (req, res) => {
    try {
        const sessions = await prisma_1.default.practiceSession.findMany({
            where: { user_id: req.user.userId },
            include: { level: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(sessions);
    }
    catch (error) {
        console.error('Get practice sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/sessions', auth_1.authenticate, async (req, res) => {
    try {
        const { level_id } = req.body;
        if (!level_id) {
            return res.status(400).json({ error: 'Level ID is required' });
        }
        const session = await prisma_1.default.practiceSession.create({
            data: {
                user_id: req.user.userId,
                level_id
            },
            include: { level: true }
        });
        res.status(201).json(session);
    }
    catch (error) {
        console.error('Create practice session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.patch('/sessions/:sessionId', auth_1.authenticate, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        const { balance, progress, completed } = req.body;
        const session = await prisma_1.default.practiceSession.update({
            where: { id: sessionIdStr },
            data: {
                balance,
                progress,
                completed
            }
        });
        res.json(session);
    }
    catch (error) {
        console.error('Update practice session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
