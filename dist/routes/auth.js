"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { email, password, teacher_code, school_id } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        let role = 'STUDENT';
        let teacherCodeUsed = null;
        let finalSchoolId = school_id;
        if (teacher_code === 'ADMINSECRET123') {
            role = 'ADMIN';
            teacherCodeUsed = 'ADMINSECRET123';
        }
        else if (teacher_code) {
            const validCode = await prisma_1.default.teacherCode.findUnique({
                where: { code: teacher_code },
                include: { school: true }
            });
            if (!validCode || new Date() > validCode.expires_at) {
                return res.status(400).json({ error: 'Invalid or expired teacher code' });
            }
            role = 'TEACHER';
            teacherCodeUsed = teacher_code;
            if (!finalSchoolId) {
                finalSchoolId = validCode.school_id;
            }
        }
        const password_hash = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password_hash,
                role: role,
                teacher_code_used: teacherCodeUsed,
                school_id: finalSchoolId
            }
        });
        const token = (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            schoolId: user.school_id || undefined
        });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                school_id: user.school_id
            }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await (0, auth_1.verifyPassword)(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            schoolId: user.school_id || undefined
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                school_id: user.school_id
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
