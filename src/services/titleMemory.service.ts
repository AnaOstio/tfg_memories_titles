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

export default class TitleMemoryService {
    static async getAll(filter: ITitleMemoryFilter, paginationOptions: IPaginationOptions): Promise<IPaginatedResult<ITitleMemory>> {
        const query = TitleMemory.find(filter);
        return await paginate<ITitleMemory>(query, paginationOptions);
    }

    static async bulkCreate(titleMemories: ITitleMemory[]): Promise<ITitleMemory[]> {
        return await TitleMemory.insertMany(titleMemories);
    }

    static async create(titleMemoryData: ITitleMemoryInput): Promise<ITitleMemory> {
        try {
            // 1. Validar skills existentes si las hay
            if (titleMemoryData.existingSkills && titleMemoryData.existingSkills.length > 0) {
                const areSkillsValid = await validateSkills(titleMemoryData.existingSkills);
                if (!areSkillsValid) {
                    throw new Error('Invalid existing skills');
                }
            }

            // Mapa para generated_id → ID real
            const generatedIdToRealId: Record<string, string> = {};

            // Procesar skills
            const finalSkills: string[] = [...(titleMemoryData.existingSkills || [])];

            // 2. Crear nuevas skills si existen
            if (titleMemoryData.skills && Array.isArray(titleMemoryData.skills)) {
                const newSkillsInput = titleMemoryData.skills as unknown as ISkillInput[];
                const skillsToCreate = newSkillsInput.map(({ generated_id, ...rest }) => rest);

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

            // 3. Procesar learning outcomes
            const finalLearningOutcomes: Array<{ [key: string]: string[] }> = [];

            // Procesar existing learning outcomes
            if (titleMemoryData.existinglearningOutcomes) {
                const outcomeIds = titleMemoryData.existinglearningOutcomes.map(o => Object.keys(o)[0]);
                const areOutcomesValid = await validateLearningOutcomes(outcomeIds);
                if (!areOutcomesValid) throw new Error('Invalid existing learning outcomes');

                for (const outcome of titleMemoryData.existinglearningOutcomes) {
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
                    skills_id: outcome.skills_id.map(id => generatedIdToRealId[id] || id)
                }));

                const createdOutcomes = await createLearningOutcomes(outcomesToCreate);

                createdOutcomes.forEach((outcome, index) => {
                    const skillIds = newOutcomesInput[index].skills_id
                        .map(id => generatedIdToRealId[id] || id);
                    finalLearningOutcomes.push({ [outcome._id]: skillIds });
                });
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

    static async update(id: string, updateData: Partial<ITitleMemory>): Promise<ITitleMemory | null> {
        return await TitleMemory.findByIdAndUpdate(id, updateData, { new: true });
    }

    static async delete(id: string): Promise<ITitleMemory | null> {
        return await TitleMemory.findByIdAndDelete(id);
    }

    static async getById(id: string): Promise<ITitleMemory | null> {
        return await TitleMemory.findById(id);
    }

    static async getByUserId(userId: string, paginationOptions: IPaginationOptions): Promise<IPaginatedResult<ITitleMemory>> {
        const query = TitleMemory.find({ userId });
        return await paginate<ITitleMemory>(query, paginationOptions);
    }

    static async search(filter: ITitleMemoryFilter, paginationOptions: IPaginationOptions): Promise<IPaginatedResult<ITitleMemory>> {
        const queryConditions = [];

        if (filter.name) {
            queryConditions.push({
                name: { $regex: filter.name, $options: 'i' }
            });
        }

        if (filter.titleCode) {
            queryConditions.push({
                titleCode: filter.titleCode
            });
        }

        const query = queryConditions.length > 0
            ? TitleMemory.find({ $or: queryConditions })
            : TitleMemory.find();

        return await paginate<ITitleMemory>(query, paginationOptions);
    }
}