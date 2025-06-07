import express from 'express';
import cors from 'cors';
import Logger from './config/logger';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './config/swagger';
import titleMemoryRoutes from './routers/titleMemory.routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app = express();

// Configuración de morgan para logs HTTP
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
const morganStream = {
    write: (message: string) => Logger.http(message.trim())
};

app.use(morgan(morganFormat, { stream: morganStream }));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/title-memories', titleMemoryRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;