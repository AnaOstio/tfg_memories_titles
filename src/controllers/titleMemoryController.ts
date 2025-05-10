import { Request, Response } from 'express';
import TitleMemoryService from '../services/titleMemory.service';
import {
    ITitleMemory,
    ITitleMemoryFilter,
} from '../interfaces/titleMemory.interface';
import { IPaginationOptions } from '../interfaces/pagination.interface';
import { validateToken } from '../services/auth.services';

export default class TitleMemoryController {
    static async getAll(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const paginationOptions: IPaginationOptions = {
                page: Number(page),
                limit: Number(limit)
            };

            const result = await TitleMemoryService.getAll({}, paginationOptions);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async bulkCreate(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid, userId } = await validateToken(token);
            if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

            const titleMemories: ITitleMemory[] = req.body.map((item: any) => ({
                ...item,
                userId
            }));

            const result = await TitleMemoryService.bulkCreate(titleMemories);
            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid, userId } = await validateToken(token);
            if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

            const titleMemoryData: ITitleMemory = {
                ...req.body,
                userId
            };

            const result = await TitleMemoryService.create(titleMemoryData);
            res.status(201).json(result);
        } catch (error: any) {
            console.error(error);
            const status = error.message.includes('Invalid') ? 400 : 500;
            res.status(status).json({ message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid } = await validateToken(token);
            if (!isValid) return res.status(401).json({ message: 'Invalid token' });

            const { id } = req.params;
            const updateData: Partial<ITitleMemory> = req.body;
            const result = await TitleMemoryService.update(id, updateData);

            if (!result) {
                return res.status(404).json({ message: 'Title memory not found' });
            }

            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid } = await validateToken(token);
            if (!isValid) return res.status(401).json({ message: 'Invalid token' });

            const { id } = req.params;
            const result = await TitleMemoryService.delete(id);

            if (!result) {
                return res.status(404).json({ message: 'Title memory not found' });
            }

            res.json({ message: 'Title memory deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await TitleMemoryService.getById(id);

            if (!result) {
                return res.status(404).json({ message: 'Title memory not found' });
            }

            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getByUserId(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid, userId } = await validateToken(token);
            if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

            const { page = 1, limit = 10 } = req.query;
            const paginationOptions: IPaginationOptions = {
                page: Number(page),
                limit: Number(limit)
            };

            const result = await TitleMemoryService.getByUserId(userId, paginationOptions);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async search(req: Request, res: Response) {
        try {
            const { name, titleCode, page = 1, limit = 10 } = req.query;
            const filter: ITitleMemoryFilter = {
                name: name as string,
                titleCode: titleCode ? Number(titleCode) : undefined
            };

            const paginationOptions: IPaginationOptions = {
                page: Number(page),
                limit: Number(limit)
            };

            const result = await TitleMemoryService.search(filter, paginationOptions);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}