"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        const [users, courses, posts] = await Promise.all([
            prisma_1.default.user.findMany({
                where: {
                    OR: [
                        { email: { contains: q } },
                        { profile: { username: { contains: q } } }
                    ]
                },
                include: { profile: true },
                take: 10
            }),
            prisma_1.default.course.findMany({
                where: {
                    title: { contains: q }
                },
                include: {
                    teacher: { include: { profile: true } }
                },
                take: 10
            }),
            prisma_1.default.post.findMany({
                where: {
                    content: { contains: q }
                },
                include: {
                    author: { include: { profile: true } }
                },
                take: 10
            })
        ]);
        res.json({ users, courses, posts });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
