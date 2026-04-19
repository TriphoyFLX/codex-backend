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
        const notifications = await prisma_1.default.notificationReceiver.findMany({
            where: { user_id: req.user.userId },
            include: {
                notification: {
                    include: {
                        creator: { include: { profile: true } }
                    }
                }
            },
            orderBy: {
                notification: { created_at: 'desc' }
            }
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, content, user_ids, send_to_all } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        let receivers = [];
        if (send_to_all) {
            // Send to all users
            const allUsers = await prisma_1.default.user.findMany({
                select: { id: true }
            });
            receivers = allUsers.map(user => ({ user_id: user.id }));
        }
        else if (user_ids) {
            // Send to specific users
            receivers = user_ids.map((user_id) => ({ user_id }));
        }
        else {
            return res.status(400).json({ error: 'user_ids or send_to_all is required' });
        }
        const notification = await prisma_1.default.notification.create({
            data: {
                title,
                content,
                created_by: req.user.userId,
                school_id: req.user.schoolId || undefined,
                receivers: {
                    create: receivers
                }
            },
            include: {
                receivers: { include: { user: { include: { profile: true } } } }
            }
        });
        res.status(201).json(notification);
    }
    catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
