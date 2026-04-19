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
// Get today's daily challenge
router.get('/daily', auth_1.authenticate, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const challenge = await prisma_1.default.challenge.findFirst({
            where: {
                active_date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                creator: { include: { profile: true } }
            }
        });
        // Check if user already attempted today's challenge
        const todayAttempt = await prisma_1.default.challengeAttempt.findFirst({
            where: {
                user_id: req.user.userId,
                challenge_id: challenge?.id,
                created_at: {
                    gte: today
                }
            }
        });
        // Get user's streak
        let streak = await prisma_1.default.userStreak.findUnique({
            where: { user_id: req.user.userId }
        });
        if (!streak) {
            streak = await prisma_1.default.userStreak.create({
                data: { user_id: req.user.userId }
            });
        }
        res.json({
            challenge,
            alreadyAttempted: !!todayAttempt,
            streak: {
                current: streak.current_streak,
                longest: streak.longest_streak,
                totalDays: streak.total_practice_days
            }
        });
    }
    catch (error) {
        console.error('Get daily challenge error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Submit answer to challenge
router.post('/:challengeId/submit', auth_1.authenticate, async (req, res) => {
    try {
        const { challengeId } = req.params;
        const challengeIdStr = Array.isArray(challengeId) ? challengeId[0] : challengeId;
        const { answer, timeSpent, usedHint } = req.body;
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id: challengeIdStr }
        });
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        // Parse answers
        const userAnswer = typeof answer === 'string' ? answer : JSON.stringify(answer);
        const correctAnswer = challenge.answer;
        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        // Calculate rewards
        let xpEarned = 0;
        let coinsEarned = 0;
        if (isCorrect) {
            xpEarned = challenge.xp_reward;
            coinsEarned = usedHint ? challenge.coin_reward / 2 : challenge.coin_reward;
            // Bonus for speed (under 30 seconds)
            if (timeSpent < 30) {
                xpEarned = Math.floor(xpEarned * 1.5);
                coinsEarned = Math.floor(coinsEarned * 1.5);
            }
        }
        // Create attempt
        const attempt = await prisma_1.default.challengeAttempt.create({
            data: {
                challenge_id: challengeIdStr,
                user_id: req.user.userId,
                answer: userAnswer,
                correct: isCorrect,
                time_spent: timeSpent || 0,
                used_hint: usedHint || false,
                xp_earned: xpEarned,
                coins_earned: coinsEarned
            }
        });
        // Update user stats if correct
        if (isCorrect) {
            await prisma_1.default.userStats.update({
                where: { user_id: req.user.userId },
                data: {
                    xp: { increment: xpEarned },
                    coins: { increment: coinsEarned }
                }
            });
        }
        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const streak = await prisma_1.default.userStreak.findUnique({
            where: { user_id: req.user.userId }
        });
        if (streak) {
            const lastPractice = streak.last_practice_date ? new Date(streak.last_practice_date) : null;
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            let newCurrentStreak = streak.current_streak;
            let newLongestStreak = streak.longest_streak;
            let newTotalDays = streak.total_practice_days;
            if (lastPractice && lastPractice >= yesterday && lastPractice < today) {
                // Consecutive day
                newCurrentStreak++;
            }
            else if (!lastPractice || lastPractice < yesterday) {
                // Streak broken or first day
                newCurrentStreak = 1;
            }
            newTotalDays++;
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
            await prisma_1.default.userStreak.update({
                where: { user_id: req.user.userId },
                data: {
                    current_streak: newCurrentStreak,
                    longest_streak: newLongestStreak,
                    last_practice_date: new Date(),
                    total_practice_days: newTotalDays
                }
            });
        }
        res.json({
            attempt,
            correct: isCorrect,
            xpEarned,
            coinsEarned,
            explanation: challenge.explanation
        });
    }
    catch (error) {
        console.error('Submit challenge error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get challenge hint (costs coins)
router.get('/:challengeId/hint', auth_1.authenticate, async (req, res) => {
    try {
        const { challengeId } = req.params;
        const challengeIdStr = Array.isArray(challengeId) ? challengeId[0] : challengeId;
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id: challengeIdStr }
        });
        if (!challenge || !challenge.hint) {
            return res.status(404).json({ error: 'Hint not available' });
        }
        // Check if user has enough coins
        const userStats = await prisma_1.default.userStats.findUnique({
            where: { user_id: req.user.userId }
        });
        if (!userStats || userStats.coins < challenge.hint_cost) {
            return res.status(400).json({ error: 'Not enough coins' });
        }
        // Deduct coins
        await prisma_1.default.userStats.update({
            where: { user_id: req.user.userId },
            data: { coins: { decrement: challenge.hint_cost } }
        });
        res.json({ hint: challenge.hint, cost: challenge.hint_cost });
    }
    catch (error) {
        console.error('Get hint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get practice leaderboard
router.get('/leaderboard', auth_1.authenticate, async (req, res) => {
    try {
        const leaderboard = await prisma_1.default.userStreak.findMany({
            include: {
                user: {
                    include: { profile: true }
                }
            },
            orderBy: [
                { current_streak: 'desc' },
                { total_practice_days: 'desc' }
            ],
            take: 10
        });
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create challenge (admin/teacher only)
router.post('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const { title, description, type, difficulty, content, answer, explanation, xp_reward, coin_reward, hint, hint_cost, active_date } = req.body;
        if (!title || !type || !content || !answer) {
            return res.status(400).json({ error: 'Title, type, content, and answer are required' });
        }
        const challenge = await prisma_1.default.challenge.create({
            data: {
                title,
                description,
                type,
                difficulty: difficulty || 'medium',
                content: typeof content === 'string' ? content : JSON.stringify(content),
                answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
                explanation,
                xp_reward: xp_reward || 10,
                coin_reward: coin_reward || 5,
                hint,
                hint_cost: hint_cost || 10,
                active_date: active_date ? new Date(active_date) : new Date(),
                created_by: req.user.userId
            },
            include: {
                creator: { include: { profile: true } }
            }
        });
        res.status(201).json(challenge);
    }
    catch (error) {
        console.error('Create challenge error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all challenges (admin/teacher only)
router.get('/', auth_1.authenticate, roles_1.requireTeacher, async (req, res) => {
    try {
        const challenges = await prisma_1.default.challenge.findMany({
            include: {
                creator: { include: { profile: true } },
                _count: { select: { attempts: true } }
            },
            orderBy: { active_date: 'desc' }
        });
        res.json(challenges);
    }
    catch (error) {
        console.error('Get challenges error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
