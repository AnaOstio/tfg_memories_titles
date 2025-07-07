import TitleMemory from '../models/titleMemory.model';
import {
    ILearningOutcomeInput,
    ISkillInput,
    ITitleMemory,
    ITitleMemoryFilter,
    ITitleMemoryInput
} from '../interfaces/titleMemory.interface';
import { paginate } from '../utils/pagination';
import { validateSkills, createSkills, createLearningOutcomes, validateLearningOutcomes } from './skillLearningOutcome.servie';
import { IPaginatedResult, IPaginationOptions } from '../interfaces/pagination.interface';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { getById } from '../controllers/titleMemoryController';
import { changeStatusSubjects } from './subject.service';

export default class TitleMemoryService {
    static async getAll(
        filter: ITitleMemoryFilter,
        paginationOptions: IPaginationOptions
    ): Promise<IPaginatedResult<ITitleMemory>> {
        try {
            const query = TitleMemory.find(filter);
            const result = await paginate<ITitleMemory>(query, paginationOptions);
            return result;
        } catch (error) {
            console.error('Error in TitleMemoryService.getAll:', error);
            throw error;
        }
    }

    static async bulkCreate(titleMemories: ITitleMemory[]): Promise<ITitleMemory[]> {
        return await TitleMemory.insertMany(titleMemories);
    }

    static async create(titleMemoryData: ITitleMemoryInput): Promise<ITitleMemory> {
        try {
            // 1. Validar skills existentes si las hay
            if (titleMemoryData.existingSkills && titleMemoryData.existingSkills.length > 0) {
                const [areSkillsValid, _] = await validateSkills(titleMemoryData.existingSkills);
                if (!areSkillsValid) {
                    throw new Error('Invalid existing skills');
                }
            }

            // Mapa para generated_id → ID real
            const generatedIdToRealId: Record<string, string> = {};
            const nameGeneratedId: Record<string, string> = {}

            // Procesar skills
            const finalSkills: string[] = [...(titleMemoryData.existingSkills || [])];

            // 2. Crear nuevas skills si existen
            if (titleMemoryData.skills && Array.isArray(titleMemoryData.skills)) {
                if (titleMemoryData.skills.every(s => !s.hasOwnProperty('generated_id'))) {
                    titleMemoryData.skills.map((skill: any) => {
                        skill.generated_id = randomUUID();
                        nameGeneratedId[skill.name] = skill.generated_id;
                    });
                }
                const newSkillsInput = titleMemoryData.skills as unknown as ISkillInput[];
                const skillsToCreate = newSkillsInput.map(({ generated_id, ...rest }) => rest);

                if (skillsToCreate.length !== 0) {

                    const createdSkills = await createSkills(skillsToCreate);
                    // Mapear generated_id a IDs reales
                    newSkillsInput.forEach((skill, index) => {
                        if (skill.generated_id) {
                            generatedIdToRealId[skill.generated_id] = createdSkills[index]._id;
                        }
                    });

                    // Agregar IDs al array final
                    finalSkills.push(...createdSkills.map(skill => skill._id));
                }
            }

            // 3. Procesar learning outcomes
            const finalLearningOutcomes: Array<{ [key: string]: string[] }> = [];

            // Procesar existing learning outcomes
            if ((titleMemoryData.existinglearningOutcomes ?? []).length !== 0) {
                const outcomeIds = (titleMemoryData.existinglearningOutcomes ?? []).map(o => Object.keys(o)[0]);
                const [areOutcomesValid, _] = await validateLearningOutcomes(outcomeIds);
                if (!areOutcomesValid) throw new Error('Invalid existing learning outcomes');
                for (const outcome of (titleMemoryData.existinglearningOutcomes ?? [])) {
                    const outcomeId = Object.keys(outcome)[0];
                    const skillIds = outcome[outcomeId].map(id => generatedIdToRealId[id] || id);
                    finalLearningOutcomes.push({ [outcomeId]: skillIds });
                }

            }

            // Procesar nuevos learning outcomes
            if (titleMemoryData.learningOutcomes && Array.isArray(titleMemoryData.learningOutcomes)) {
                const newOutcomesInput = titleMemoryData.learningOutcomes as unknown as ILearningOutcomeInput[];
                const outcomesToCreate = newOutcomesInput.map(outcome => ({
                    ...outcome,
                    skills_id: outcome.skills_id.map(id => generatedIdToRealId[id] || generatedIdToRealId[nameGeneratedId[id]] || id)
                }));


                if (outcomesToCreate.length !== 0) {
                    const createdOutcomes = await createLearningOutcomes(outcomesToCreate);

                    createdOutcomes.forEach((outcome, index) => {
                        const skillIds = newOutcomesInput[index].skills_id
                            .map(id => generatedIdToRealId[id] || id);
                        finalLearningOutcomes.push({ [outcome._id]: skillIds });
                    });
                }
            }

            // 4. Crear el documento final
            const finalData = {
                ...titleMemoryData,
                skills: finalSkills,
                learningOutcomes: finalLearningOutcomes,
                existingSkills: undefined,
                existinglearningOutcomes: undefined
            };

            const titleMemory = new TitleMemory(finalData);
            return await titleMemory.save();
        } catch (error) {
            console.error('Error creating title memory:', error);
            throw error;
        }
    }

    static async update(id: string, updateData: Partial<ITitleMemoryInput>): Promise<ITitleMemory | null> {
        try {
            return await TitleMemory.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            console.error('Error updating title memory:', error);
            throw error;
        }
    }

    static async delete(id: string): Promise<ITitleMemory | null> {
        return await TitleMemory.findByIdAndUpdate(
            id,
            { status: 'deleted' },
            { new: true }
        );
    }

    static async getById(id: string): Promise<ITitleMemory | null> {
        const a = await TitleMemory.findById(id).lean();
        if (!a) {
            throw new Error('Title memory not found');
        }
        return a;
    }

    static async getByUserId(memories: string[], paginationOptions: IPaginationOptions): Promise<IPaginatedResult<ITitleMemory>> {
        const query = TitleMemory.find({ _id: { $in: memories } })
            .sort({ yearDelivery: -1, name: 1 });
        return await paginate<ITitleMemory>(query, paginationOptions);
    }

    static async search(
        filter: ITitleMemoryFilter,
        paginationOptions: IPaginationOptions
    ): Promise<IPaginatedResult<ITitleMemory>> {
        try {
            const queryConditions: any = {};

            // 1. Búsqueda por nombre (insensible a mayúsculas/minúsculas, coincidencia parcial)
            if (filter.name) {
                queryConditions.name = { $regex: filter.name, $options: 'i' };
            }

            // 2. Búsqueda por código de título (exacta)
            if (filter.titleCode) {
                queryConditions.titleCode = filter.titleCode;
            }

            // 3. Filtros para campos de array (coincidencia con AL MENOS UNO de los valores)
            if (filter.universities?.length) {
                queryConditions.universities = { $in: filter.universities };
            }

            if (filter.centers?.length) {
                queryConditions.centers = { $in: filter.centers };
            }

            // 4. Filtro para campos de string simple (coincidencia exacta o con $in)
            if (filter.academicLevel?.length) {
                // academicLevel es string (no array) en el documento, pero el filtro viene como array
                queryConditions.academicLevel = { $in: filter.academicLevel };
            }

            if (filter.branchAcademic?.length) {
                // branch es string en el documento
                queryConditions.branch = { $in: filter.branchAcademic };
            }

            if (filter.academicFields?.length) {
                // academicField es string en el documento
                queryConditions.academicField = { $in: filter.academicFields };
            }

            // 5. Filtro por año (yearDelivery en el documento)
            if (filter.yearFrom || filter.yearTo) {
                queryConditions.yearDelivery = {};
                if (filter.yearFrom) queryConditions.yearDelivery.$gte = filter.yearFrom;
                if (filter.yearTo) queryConditions.yearDelivery.$lte = filter.yearTo;
            }

            // 6. Filtro por ID de usuario (si se proporciona)
            if (filter.titleMemoriesToReturn?.length) {
                queryConditions._id = { $in: filter.titleMemoriesToReturn };
            }

            // 7. Filtro por estado (excluyendo "deleted")
            queryConditions.status = { $ne: 'deleted' };

            // 6. Construir la consulta con posible ordenación
            const query = TitleMemory.find(queryConditions)
                .sort({ yearDelivery: -1, name: 1 }); // Ordenar por año descendente y nombre ascendente

            return await paginate<ITitleMemory>(query, paginationOptions);
        } catch (error) {
            console.error('Error in TitleMemoryService.search:', error);
            throw new Error('Failed to search title memories');
        }
    }

    static async checkTitleUser(titleMemoryId: string, userId: string): Promise<boolean> {
        const titleMemory = await TitleMemory.findOne({ _id: titleMemoryId, userId });
        return !!titleMemory;
    }

    static async validateSkillsFromTitle(titleMemoryId: string, skills: any): Promise<boolean> {
        const titleMemory = await TitleMemory.findById(titleMemoryId);
        if (!titleMemory) {
            throw new Error('Title memory not found');
        }

        const skillsFromTitle = titleMemory.skills || [];
        const missingSkills = skills.filter((skill: any) => !skillsFromTitle.includes(skill));

        if (missingSkills.length > 0) {
            throw new Error(`The following skills are not present in the title memory: ${missingSkills.join(', ')}`);
        }

        return true;
    }

    static async validateOutcomesFromTitle(titleMemoryId: string, outcomes: any): Promise<boolean> {
        const titleMemory = await TitleMemory.findById(titleMemoryId);
        if (!titleMemory) {
            throw new Error('Title memory not found');
        }
        const outcomesFromTitle = titleMemory.learningOutcomes || [];
        // Extraer todas las keys (IDs de outcomes) del hash
        const outcomeKeys = outcomesFromTitle.map((o: any) => Object.keys(o)[0]);

        // Buscar los outcomes que faltan
        const missingOutcomes = outcomes.filter((id: string) => !outcomeKeys.includes(id));

        if (missingOutcomes.length > 0) {
            throw new Error(`The following learning outcomes are not present in the title memory: ${missingOutcomes.join(', ')}`);
        }

        return true;
    }

    static async changeOutcomes(newOutcomeId: string, oldOutcomeIds: string[]): Promise<any> {
        if (!newOutcomeId || !oldOutcomeIds?.length) {
            throw new Error('Debes proporcionar newOutcomeId y al menos un oldOutcomeId');
        }

        const newOid = new Types.ObjectId(newOutcomeId);
        const oldOids = oldOutcomeIds.map(id => new Types.ObjectId(id));

        // Solo los documentos que contengan al menos uno de los antiguos
        const filter = { learningsOutcomes: { $in: oldOids } };

        // Uso de arrayFilters para reemplazar en línea cada elemento coincidente
        return TitleMemory.updateMany(
            filter,
            { $set: { 'learningsOutcomes.$[elem]': newOid } },
            {
                arrayFilters: [
                    { 'elem': { $in: oldOids } }
                ]
            }
        ).exec();
    }

    static async changeSkills(newSkill: string, lastSkills: string[]): Promise<any> {
        if (!newSkill || !lastSkills?.length) {
            throw new Error('Debes proporcionar newOutcomeId y al menos un oldOutcomeId');
        }

        const newOid = new Types.ObjectId(newSkill);
        const oldOids = lastSkills.map(id => new Types.ObjectId(id));

        // Solo los documentos que contengan al menos uno de los antiguos
        const filter = { learningsOutcomes: { $in: oldOids } };

        // Uso de arrayFilters para reemplazar en línea cada elemento coincidente
        return TitleMemory.updateMany(
            filter,
            { $set: { 'skills.$[elem]': newOid } },
            {
                arrayFilters: [
                    { 'elem': { $in: oldOids } }
                ]
            }
        ).exec();
    }
}