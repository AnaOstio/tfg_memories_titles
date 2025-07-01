import { Request, Response } from 'express';
import TitleMemoryService from '../services/titleMemory.service';
import {
    ITitleMemory,
    ITitleMemoryFilter,
    ITitleMemoryInput,
    ITitleMemorySearchParams,
} from '../interfaces/titleMemory.interface';
import { IPaginationOptions } from '../interfaces/pagination.interface';
import { validateToken } from '../services/auth.services';
import { } from '../interfaces/titleMemory.interface';
import { getLearningOutcomesByIds, getSkillsByIds } from '../services/skillLearningOutcome.servie';
import path from 'path';
import fs from 'fs/promises';
import { getPermissionsByUser } from '../services/permissions.service';
import mongoose, { Types } from 'mongoose';


export const getAll = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const paginationOptions: IPaginationOptions = {
            page: Number(page),
            limit: Number(limit)
        };

        const result = await TitleMemoryService.getAll({}, paginationOptions);
        res.json(result);
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const bulkCreate = async (req: Request, res: Response) => {
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

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const create = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const { isValid, userId } = await validateToken(token);
        if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

        const titleMemoryData: ITitleMemoryInput = {
            ...req.body,
            userId
        };

        const result = await TitleMemoryService.create(titleMemoryData);
        res.status(201).json(result);
    } catch (error: any) {

        const status = error.message.includes('Invalid') ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
}

export const update = async (req: Request, res: Response) => {
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

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteMemory = async (req: Request, res: Response) => {
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

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await TitleMemoryService.getById(id);

        if (!result) {
            return res.status(404).json({ message: 'Title memory not found' });
        }

        // ahora pedimos los skills y los learning outcomes
        const skills = await getSkillsByIds(result.skills?.map(s => s.toString()) || []);
        const outcomeIds = result.learningOutcomes?.map(item => Object.keys(item)[0]);
        const learningOutcomes = await getLearningOutcomesByIds(outcomeIds || []);
        result.skills = skills;
        result.learningOutcomes = learningOutcomes;

        res.json(result);
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getByUserId = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const { isValid, userId } = await validateToken(token);
        if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

        // Tenemos que ir a permisos a comprobar cuales son los que tiene de usuario
        const permissions = await getPermissionsByUser(token);
        const memories = permissions?.data.map((p: any) => p.memoryId) || [];

        const { page = 1, limit = 10 } = req.query;
        const paginationOptions: IPaginationOptions = {
            page: Number(page),
            limit: Number(limit)
        };

        const result = await TitleMemoryService.getByUserId(memories, paginationOptions);
        const toReturn = {
            result,
            permissions: permissions?.data || []
        }
        res.json(toReturn);
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const search = async (req: Request, res: Response) => {
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

        // Manejar el rango de años
        if (filters.year?.length === 2) {
            filter.yearFrom = Math.min(...filters.year);
            filter.yearTo = Math.max(...filters.year);
        }

        // Necesito sacar solo las del usuario si esta a true
        if (fromUser) {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const { isValid, userId } = await validateToken(token);
            if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

            const permissions = await getPermissionsByUser(token);

            filter.titleMemoriesToReturn = permissions.data
                .map((t: any) => new mongoose.Types.ObjectId(String(t.memoryId))) || [];
        }

        const paginationOptions: IPaginationOptions = {
            page: Number(page),
            limit: Number(limit)
        };

        const result = await TitleMemoryService.search(filter, paginationOptions);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

export const checkTitleUser = async (req: Request, res: Response) => {
    try {

        const { titleMemoryId, userId } = req.body;
        const result = await TitleMemoryService.checkTitleUser(titleMemoryId, userId);

        if (result) {
            return res.status(200).json({ message: 'El título ya existe para este usuario' });
        }

        res.status(401).json({ message: 'El titulo no pertenece a este usuario' });
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}

export const validateSkillsFromTitle = async (req: Request, res: Response) => {
    try {
        const { titleMemoryId, skills } = req.body;
        const result = await TitleMemoryService.validateSkillsFromTitle(titleMemoryId, skills);

        if (result) {
            return res.status(200).json({ message: 'El título tiene habilidades asociadas' });
        }

        res.status(401).json({ message: 'El titulo no tiene habilidades asociadas' });
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}


export const validateOutcomesFromTitle = async (req: Request, res: Response) => {
    try {
        const { titleMemoryId, learningOutcomes } = req.body;
        const result = await TitleMemoryService.validateOutcomesFromTitle(titleMemoryId, learningOutcomes);

        if (result) {
            return res.status(200).json({ message: 'El título tiene resultados de aprendizaje asociados' });
        }

        res.status(401).json({ message: 'El titulo no tiene resultados de aprendizaje asociados' });
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
}


const REQUIRED_KEYS = [
    'titleCode',
    'universities',
    'centers',
    'name',
    'academicLevel',
    'branch',
    'academicField',
    'status',
    'yearDelivery',
    'totalCredits',
    'distributedCredits',
    'skills',
    'learningOutcomes'
];


function validateStructure(item: any, idx: number): string[] {
    const errs: string[] = [];
    if (typeof item !== 'object' || item === null) {
        errs.push(`Ítem ${idx}: no es un objeto.`);
        return errs;
    }
    for (const key of REQUIRED_KEYS) {
        if (!(key in item)) {
            errs.push(`Ítem ${idx}: falta la propiedad "${key}".`);
        }
    }
    if ('titleCode' in item && typeof item.titleCode !== 'string') {
        errs.push(`Ítem ${idx}: "titleCode" debe ser string, no ${typeof item.titleCode}.`);
    }
    return errs;
}

export const createFromFiles = async (req: Request, res: Response) => {
    try {
        // 1) Autenticación
        const auth = req.headers.authorization?.split(' ')[1];
        if (!auth) return res.status(401).json({ message: 'No token provided' });

        const { isValid, userId } = await validateToken(auth);
        if (!isValid || !userId) return res.status(401).json({ message: 'Invalid token' });

        // 2) Archivos
        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        const created: any[] = [];

        for (const file of files) {
            // 3) Leer y parsear
            const raw = file.buffer.toString("utf-8");
            let jsonArray: any;
            try {
                jsonArray = JSON.parse(raw);
            } catch {
                return res.status(400).json({ message: `Archivo ${file.originalname}: JSON inválido` });
            }

            // 4) Validar esquema
            if (!Array.isArray(jsonArray)) {
                return res
                    .status(400)
                    .json({ message: `Archivo ${file.originalname}: debe ser un array de objetos` });
            }
            for (let i = 0; i < jsonArray.length; i++) {
                const errors = validateStructure(jsonArray[i], i);
                if (errors.length) {
                    return res
                        .status(400)
                        .json({ message: `Errores en ${file.originalname}: ${errors.join('; ')}` });
                }
            }

            // 5) Crear cada memoria de título
            for (const rawItem of jsonArray) {
                const itemWithUser = { ...rawItem, userId };
                // TitleMemoryService.create implementa validación de skills y outcomes
                const createdMem = await TitleMemoryService.create(itemWithUser);
                created.push(createdMem);
            }
        }

        // 7) Respuesta
        return res.status(201).json(created);
    } catch (err: any) {
        console.error('Error en createFromFiles:', err);
        return res
            .status(500)
            .json({ message: 'Internal server error', error: err.message || err.toString() });
    }
};