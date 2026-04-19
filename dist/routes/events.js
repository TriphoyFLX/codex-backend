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
        const events = await prisma_1.default.event.findMany({
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
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:eventId', auth_1.authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
        const event = await prisma_1.default.event.findUnique({
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
    }
    catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, description, image_url, visibility, date } = req.body;
        if (!title || !date) {
            return res.status(400).json({ error: 'Title and date are required' });
        }
        const event = await prisma_1.default.event.create({
            data: {
                title,
                description,
                image_url,
                visibility: visibility || 'SCHOOL',
                school_id: req.user.schoolId,
                created_by: req.user.userId,
                date: new Date(date)
            }
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:eventId/join', auth_1.authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
        const participant = await prisma_1.default.eventParticipant.create({
            data: {
                event_id: eventIdStr,
                user_id: req.user.userId
            }
        });
        res.status(201).json(participant);
    }
    catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:eventId/join', auth_1.authenticate, async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
        await prisma_1.default.eventParticipant.deleteMany({
            where: {
                event_id: eventIdStr,
                user_id: req.user.userId
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Leave event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
