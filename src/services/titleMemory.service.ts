import TitleMemory from '../models/titleMemory.model';
import {
    ITitleMemory,
    ITitleMemoryFilter
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

    static async create(titleMemoryData: ITitleMemory): Promise<ITitleMemory> {
        try {
            // 1. Validar skills existentes si las hay
            if (titleMemoryData.existingSkills && titleMemoryData.existingSkills.length > 0) {
                const areSkillsValid = await validateSkills(titleMemoryData.existingSkills);
                if (!areSkillsValid) {
                    throw new Error('Invalid existing skills');
                }
            }

            // Mapa para relacionar generated_id con los IDs reales
            const generatedIdToRealId: Record<string, string> = {};

            // 2. Procesar nuevas skills
            if (titleMemoryData.skills && titleMemoryData.skills.length > 0) {
                // Extraer solo los datos necesarios para crear las skills (sin generated_id)
                const skillsToCreate = titleMemoryData.skills.map(({ generated_id, ...skillData }) => skillData);

                // Crear las nuevas skills
                const createdSkills = await createSkills(skillsToCreate);

                // Mapear generated_id a los IDs reales
                titleMemoryData.skills.forEach((skill, index) => {
                    if (skill.generated_id) {
                        generatedIdToRealId[skill.generated_id] = createdSkills[index]._id;
                    }
                });

                // Crear el array final de skills (existingSkills + nuevas skills)
                const newSkillIds = createdSkills.map(skill => skill._id);
                titleMemoryData.skills = [
                    ...(titleMemoryData.existingSkills || []),
                    ...newSkillIds
                ];

                // Eliminar el campo existingSkills ya que ahora está en skills
                delete titleMemoryData.existingSkills;
            } else {
                // Si no hay nuevas skills, simplemente renombrar existingSkills a skills
                titleMemoryData.skills = titleMemoryData.existingSkills || [];
                delete titleMemoryData.existingSkills;
            }

            // 3. Procesar learningOutcomes (transformar existinglearningOutcomes + nuevos)
            const finalLearningOutcomes: Record<string, string[]>[] = [];

            // Procesar existinglearningOutcomes primero
            if (titleMemoryData.existinglearningOutcomes) {
                // Validar que los outcomes existan
                const outcomeIds = titleMemoryData.existinglearningOutcomes.map(outcome => Object.keys(outcome)[0]);
                const areOutcomesValid = await validateLearningOutcomes(outcomeIds);
                if (!areOutcomesValid) {
                    throw new Error('Invalid existing learning outcomes');
                }

                // Transformar las referencias
                for (const outcome of titleMemoryData.existinglearningOutcomes) {
                    const outcomeKey = Object.keys(outcome)[0];
                    const skillIds = outcome[outcomeKey];

                    const transformedSkillIds = skillIds.map(skillId => {
                        // Si es un generated_id, buscar en el mapa
                        return generatedIdToRealId[skillId] || skillId;
                    });

                    finalLearningOutcomes.push({ [outcomeKey]: transformedSkillIds });
                }
            }

            // Procesar nuevos learningOutcomes
            if (titleMemoryData.learningOutcomes && titleMemoryData.learningOutcomes.length > 0) {
                // Reemplazar generated_ids en skills_id con IDs reales
                const outcomesToCreate = titleMemoryData.learningOutcomes.map(outcome => ({
                    ...outcome,
                    skills_id: outcome.skills_id.map(skillId => generatedIdToRealId[skillId] || skillId)
                }));

                // Crear los nuevos learning outcomes
                const createdOutcomes = await createLearningOutcomes(outcomesToCreate);

                // Agregar a los resultados finales
                createdOutcomes.forEach((outcome, index) => {
                    const skillIds = titleMemoryData.learningOutcomes![index].skills_id
                        .map(skillId => generatedIdToRealId[skillId] || skillId);

                    finalLearningOutcomes.push({ [outcome._id]: skillIds });
                });
            }

            // Asignar los learning outcomes transformados
            titleMemoryData.learningOutcomes = finalLearningOutcomes;
            delete titleMemoryData.existinglearningOutcomes;

            // 5. Crear la memoria de título con la estructura exacta requerida
            const titleMemory = new TitleMemory({
                ...titleMemoryData,
                // Solo incluir los campos que deben persistir
                existingSkills: undefined,
                existinglearningOutcomes: undefined
            });

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
        const query = TitleMemory.find({
            $or: [
                { name: { $regex: filter.name || '', $options: 'i' } },
                { titleCode: filter.titleCode }
            ]
        });
        return await paginate<ITitleMemory>(query, paginationOptions);
    }
}