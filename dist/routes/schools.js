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
router.get('/', async (req, res) => {
    try {
        const { city } = req.query;
        const schools = await prisma_1.default.school.findMany({
            where: city ? { city: city } : undefined,
            orderBy: { created_at: 'desc' }
        });
        res.json(schools);
    }
    catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { name, city } = req.body;
        if (!name || !city) {
            return res.status(400).json({ error: 'Name and city are required' });
        }
        const school = await prisma_1.default.school.create({
            data: { name, city }
        });
        res.status(201).json(school);
    }
    catch (error) {
        console.error('Create school error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/teacher-codes', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { school_id, expires_in_days } = req.body;
        if (!school_id) {
            return res.status(400).json({ error: 'School ID is required' });
        }
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + (expires_in_days || 30));
        const teacherCode = await prisma_1.default.teacherCode.create({
            data: {
                code,
                school_id,
                created_by: req.user.userId,
                expires_at
            }
        });
        res.status(201).json(teacherCode);
    }
    catch (error) {
        console.error('Create teacher code error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/teacher-codes', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const codes = await prisma_1.default.teacherCode.findMany({
            where: { created_by: req.user.userId },
            include: { school: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(codes);
    }
    catch (error) {
        console.error('Get teacher codes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
