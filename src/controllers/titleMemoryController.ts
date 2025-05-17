import { Request, Response } from 'express';
import TitleMemoryService from '../services/titleMemory.service';
import {
    ITitleMemory,
    ITitleMemoryFilter,
    ITitleMemorySearchParams,
} from '../interfaces/titleMemory.interface';
import { IPaginationOptions } from '../interfaces/pagination.interface';
import { validateToken } from '../services/auth.services';
import { } from '../interfaces/titleMemory.interface';

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
            const { filters, page = 1, limit = 10, fromUser = false }: ITitleMemorySearchParams = req.body;

            // Validar parámetros básicos
            if (!filters) {
                return res.status(400).json({
                    message: 'Debe proporcionar al menos un filtro de búsqueda'
                });
            }

            // Construir el filtro basado en la nueva estructura
            const filter: ITitleMemoryFilter = {};

            // Mapear los nuevos filtros a la estructura esperada por el servicio
            if (filters.titleName) filter.name = filters.titleName[0];
            if (filters.academicLevel?.length) filter.academicLevel = filters.academicLevel;
            if (filters.academicFields?.length) filter.academicFields = filters.academicFields;
            if (filters.branchAcademic?.length) filter.branchAcademic = filters.branchAcademic;
            if (filters.universities?.length) filter.universities = filters.universities;
            if (filters.centers?.length) filter.centers = filters.centers;

            // Necesito sacar solo las del usuario si esta a true
            if (fromUser) {
                const token = req.headers.authorization?.split(' ')[1];
                if (!token) return res.status(401).json({ message: 'No token provided' });

                const { isValid, userId } = await validateToken(token);
                if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

                filter.userId = userId;
            }

            // Manejar el rango de años
            if (filters.year?.length === 2) {
                filter.yearFrom = Math.min(...filters.year);
                filter.yearTo = Math.max(...filters.year);
            }

            const paginationOptions: IPaginationOptions = {
                page: Number(page),
                limit: Number(limit)
            };

            const result = await TitleMemoryService.search(filter, paginationOptions);
            res.json(result);
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({
                message: 'Internal server error'
            });
        }
    }

    static async checkTitleUser(req: Request, res: Response) {
        try {

            const { titleMemoryId, userId } = req.body;
            const result = await TitleMemoryService.checkTitleUser(titleMemoryId, userId);

            if (result) {
                return res.status(200).json({ message: 'El título ya existe para este usuario' });
            }

            res.status(401).json({ message: 'El titulo no pertenece a este usuario' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async validateSkillsFromTitle(req: Request, res: Response) {
        try {
            const { titleMemoryId, skills } = req.body;
            const result = await TitleMemoryService.validateSkillsFromTitle(titleMemoryId, skills);

            if (result) {
                return res.status(200).json({ message: 'El título tiene habilidades asociadas' });
            }

            res.status(401).json({ message: 'El titulo no tiene habilidades asociadas' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }


    static async validateOutcomesFromTitle(req: Request, res: Response) {
        try {
            const { titleMemoryId, learningOutcomes } = req.body;
            const result = await TitleMemoryService.validateOutcomesFromTitle(titleMemoryId, learningOutcomes);

            if (result) {
                return res.status(200).json({ message: 'El título tiene resultados de aprendizaje asociados' });
            }

            res.status(401).json({ message: 'El titulo no tiene resultados de aprendizaje asociados' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}