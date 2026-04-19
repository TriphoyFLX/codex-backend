"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
router.get('/chats', auth_1.authenticate, async (req, res) => {
    try {
        const chats = await prisma_1.default.aiChat.findMany({
            where: { user_id: req.user.userId },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(chats);
    }
    catch (error) {
        console.error('Get AI chats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/chats', auth_1.authenticate, async (req, res) => {
    try {
        const chat = await prisma_1.default.aiChat.create({
            data: {
                user_id: req.user.userId
            }
        });
        res.status(201).json(chat);
    }
    catch (error) {
        console.error('Create AI chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/chats/:chatId/messages', auth_1.authenticate, async (req, res) => {
    try {
        const { chatId } = req.params;
        const chatIdStr = Array.isArray(chatId) ? chatId[0] : chatId;
        const { content, role } = req.body;
        if (!content || !role) {
            return res.status(400).json({ error: 'Content and role are required' });
        }
        const message = await prisma_1.default.aiMessage.create({
            data: {
                chat_id: chatIdStr,
                role,
                content
            }
        });
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Create AI message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// AI Coding Challenge endpoints
router.post('/generate-task', async (req, res) => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Coding Practice App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v3.2',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты - помощник по программированию. Генерируй простые практические задания для разработчиков. Задания должны быть решаемы одним файлом кода или одной функцией, без сложных систем. Ответ в формате JSON: {"type": "frontend/backend/fullstack", "title": "короткое название", "description": "краткое описание задачи (3-5 предложений)", "difficulty": "Легкий/Средний/Сложный"}'
                    },
                    {
                        role: 'user',
                        content: 'Сгенерируй одно простое практическое задание по программированию (frontend, backend или fullstack). Задание должно быть решаемо за 5-10 минут, одним файлом кода или одной функцией. Примеры: написать функцию сортировки, создать простой компонент кнопки, написать API эндпоинт для одного действия.'
                    }
                ],
                temperature: 0.8
            })
        });
        const data = await response.json();
        console.log('OpenRouter response:', JSON.stringify(data, null, 2));
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenRouter response structure:', data);
            // Return fallback task if API fails
            const fallbackTasks = [
                { type: 'frontend', title: 'Создай лендинг', description: 'Напиши HTML/CSS код для простого лендинга страницы с hero секцией, кнопкой CTA и футером.', difficulty: 'Легкий' },
                { type: 'frontend', title: 'Создай форму входа', description: 'Напиши React компонент для формы входа с валидацией email и пароля.', difficulty: 'Средний' },
                { type: 'backend', title: 'REST API эндпоинт', description: 'Напиши Express.js эндпоинт для создания пользователя с валидацией.', difficulty: 'Средний' },
                { type: 'fullstack', title: 'Todo приложение', description: 'Опиши архитектуру и напиши базовый код для простого todo приложения.', difficulty: 'Сложный' },
                { type: 'frontend', title: 'Адаптивная навигация', description: 'Создай адаптивное меню навигации с мобильным гамбургером.', difficulty: 'Средний' },
                { type: 'backend', title: 'Аутентификация JWT', description: 'Реализуй систему аутентификации с JWT токенами.', difficulty: 'Сложный' },
            ];
            const randomTask = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
            return res.json(randomTask);
        }
        let content = data.choices[0].message.content;
        // Remove markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const task = JSON.parse(content);
        res.json(task);
    }
    catch (error) {
        console.error('Generate AI task error:', error);
        // Return fallback task if API fails
        const fallbackTasks = [
            { type: 'frontend', title: 'Создай лендинг', description: 'Напиши HTML/CSS код для простого лендинга страницы с hero секцией, кнопкой CTA и футером.', difficulty: 'Легкий' },
            { type: 'frontend', title: 'Создай форму входа', description: 'Напиши React компонент для формы входа с валидацией email и пароля.', difficulty: 'Средний' },
            { type: 'backend', title: 'REST API эндпоинт', description: 'Напиши Express.js эндпоинт для создания пользователя с валидацией.', difficulty: 'Средний' },
            { type: 'fullstack', title: 'Todo приложение', description: 'Опиши архитектуру и напиши базовый код для простого todo приложения.', difficulty: 'Сложный' },
            { type: 'frontend', title: 'Адаптивная навигация', description: 'Создай адаптивное меню навигации с мобильным гамбургером.', difficulty: 'Средний' },
            { type: 'backend', title: 'Аутентификация JWT', description: 'Реализуй систему аутентификации с JWT токенами.', difficulty: 'Сложный' },
        ];
        const randomTask = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
        res.json(randomTask);
    }
});
router.post('/review-code', async (req, res) => {
    try {
        const { task, userCode } = req.body;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Coding Practice App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v3.2',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты - эксперт по код-ревью. Оцени код от 0 до 100. Проверь, правильно ли решена задача. Если код неправильный, предоставь правильное решение. Ответ в формате JSON: {"correct": true/false, "score": число, "comment": "краткий комментарий", "suggestions": ["совет1", "совет2"], "correctSolution": "код с правильным решением (если incorrect=true)"}'
                    },
                    {
                        role: 'user',
                        content: `Задание: ${task.title}\nОписание: ${task.description}\nТип: ${task.type}\nСложность: ${task.difficulty}\n\nКод пользователя:\n${userCode}\n\nОцени код, проверь правильность решения. Если код неправильный, напиши правильное решение с комментариями.`
                    }
                ],
                temperature: 0.7
            })
        });
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenRouter response structure:', data);
            // Return fallback feedback if API fails
            const fallbackFeedback = {
                correct: true,
                score: 85,
                comment: 'Код выглядит хорошо структурированным. (AI-оценка недоступна - проверьте API ключ)',
                suggestions: ['Добавьте комментарии к сложным частям кода', 'Рассмотрите использование TypeScript'],
                correctSolution: null
            };
            return res.json(fallbackFeedback);
        }
        let content = data.choices[0].message.content;
        // Remove markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const feedback = JSON.parse(content);
        res.json(feedback);
    }
    catch (error) {
        console.error('Review code error:', error);
        // Return fallback feedback if API fails
        const fallbackFeedback = {
            correct: true,
            score: 85,
            comment: 'Код выглядит хорошо структурированным. (AI-оценка недоступна - проверьте API ключ)',
            suggestions: ['Добавьте комментарии к сложным частям кода', 'Рассмотрите использование TypeScript'],
            correctSolution: null
        };
        res.json(fallbackFeedback);
    }
});
// AI Business Game Events
router.post('/generate-business-event', async (req, res) => {
    try {
        const { currentDay, money, customers, team, difficulty } = req.body;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Coding Practice App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v3.2',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты - геймдизайнер бизнес-симулятора. Генерируй случайные события для игры про стартап. Ответ в формате JSON: {"title": "короткое название", "description": "описание события (1-2 предложения)", "effect": {"money": число, "customers": число, "morale": число, "productQuality": число, "marketCondition": "bull/bear/neutral"}}. Эффекты могут быть положительными или отрицательными.'
                    },
                    {
                        role: 'user',
                        content: `Сгенерируй случайное событие для бизнес-симулятора. Текущий день: ${currentDay}, Деньги: $${money}, Клиенты: ${customers}, Команда: ${team} человек, Сложность: ${difficulty}. Событие должно быть реалистичным и интересным.`
                    }
                ],
                temperature: 0.9
            })
        });
        const data = await response.json();
        console.log('OpenRouter business event response:', JSON.stringify(data, null, 2));
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenRouter response structure:', data);
            // Return fallback event if API fails
            const fallbackEvents = [
                { title: 'Инвестор проявил интерес!', effect: { money: 5000 }, description: 'Ангельский инвестор вложил $5000 в ваш проект.' },
                { title: 'Сервер упал!', effect: { customers: -Math.floor(customers * 0.2) }, description: 'Временный сбой сервера оттолкнул некоторых клиентов.' },
                { title: 'Вирусный успех!', effect: { customers: 50 }, description: 'О вас написали в популярном блоге. Прилив новых клиентов!' },
                { title: 'Конкурент запустил похожий продукт', effect: { productQuality: -10 }, description: 'Конкурент заставил вас пересмотреть стратегию.' },
                { title: 'Команда выгорела', effect: { morale: -20 }, description: 'Команда устала от переработок.' },
            ];
            const randomEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
            return res.json(randomEvent);
        }
        let content = data.choices[0].message.content;
        // Remove markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const event = JSON.parse(content);
        res.json(event);
    }
    catch (error) {
        console.error('Generate business event error:', error);
        // Return fallback event if API fails
        const fallbackEvents = [
            { title: 'Инвестор проявил интерес!', effect: { money: 5000 }, description: 'Ангельский инвестор вложил $5000 в ваш проект.' },
            { title: 'Сервер упал!', effect: { customers: -20 }, description: 'Временный сбой сервера оттолкнул некоторых клиентов.' },
            { title: 'Вирусный успех!', effect: { customers: 50 }, description: 'О вас написали в популярном блоге. Прилив новых клиентов!' },
        ];
        const randomEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
        res.json(randomEvent);
    }
});
// AI Chat Message
router.post('/chat-message', async (req, res) => {
    try {
        const { message, chatHistory } = req.body;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Coding Practice App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-v3.2',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты - полезный AI ассистент для образовательной платформы. Твоя задача - помогать ученикам понимать учебный материал. ВАЖНО: Если пользователь просит решить домашнее задание или дать готовый ответ на задачу, НЕ ДАВАЙ ГОТОВЫЙ ОТВЕТ. Вместо этого объясни теорию, дай подсказки, направи на правильное решение, объясни концепции, которые помогут решить задачу самостоятельно. Будь дружелюбным, поддерживающим и мотивирующим. Отвечай на русском языке.'
                    },
                    ...(chatHistory || []),
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7
            })
        });
        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenRouter response structure:', data);
            return res.status(500).json({ error: 'Failed to get AI response' });
        }
        const content = data.choices[0].message.content;
        res.json({ content });
    }
    catch (error) {
        console.error('AI chat message error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});
exports.default = router;
