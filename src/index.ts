import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import schoolRoutes from './routes/schools';
import courseRoutes from './routes/courses';
import postRoutes from './routes/posts';
import assignmentRoutes from './routes/assignments';
import practiceRoutes from './routes/practice';
import challengesRoutes from './routes/challenges';
import eventRoutes from './routes/events';
import notificationRoutes from './routes/notifications';
import leaderboardRoutes from './routes/leaderboard';
import aiRoutes from './routes/ai';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api', (req, res) => {
  res.json({ message: 'Backend API is running', tech: 'Node.js + Express + TypeScript' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
