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
        const posts = await prisma_1.default.post.findMany({
            include: {
                author: { include: { profile: true } },
                likes: true,
                comments: {
                    include: { author: { include: { profile: true } } },
                    orderBy: { created_at: 'asc' }
                },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(posts);
    }
    catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { content, image_url } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const post = await prisma_1.default.post.create({
            data: {
                content,
                image_url,
                author_id: req.user.userId
            },
            include: {
                author: { include: { profile: true } }
            }
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:postId/like', auth_1.authenticate, async (req, res) => {
    try {
        const { postId } = req.params;
        const postIdStr = Array.isArray(postId) ? postId[0] : postId;
        const existing = await prisma_1.default.postLike.findUnique({
            where: {
                user_id_post_id: {
                    user_id: req.user.userId,
                    post_id: postIdStr
                }
            }
        });
        if (existing) {
            await prisma_1.default.postLike.delete({
                where: { id: existing.id }
            });
            return res.json({ liked: false });
        }
        await prisma_1.default.postLike.create({
            data: {
                user_id: req.user.userId,
                post_id: postIdStr
            }
        });
        res.json({ liked: true });
    }
    catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:postId/comments', auth_1.authenticate, async (req, res) => {
    try {
        const { postId } = req.params;
        const postIdStr = Array.isArray(postId) ? postId[0] : postId;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const comment = await prisma_1.default.comment.create({
            data: {
                post_id: postIdStr,
                author_id: req.user.userId,
                content
            },
            include: {
                author: { include: { profile: true } }
            }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
