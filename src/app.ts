import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/database';
import titleMemoryRoutes from './routers/titleMemory.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/title-memories', titleMemoryRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

export default app;