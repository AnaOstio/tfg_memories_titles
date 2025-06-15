import axios from 'axios';

const SKILLS_SERVICE_URL = process.env.SKILLS_SERVICE_URL || 'http://localhost:3001';

export const validateSkills = async (skillIds: string[]): Promise<[boolean, any]> => {
    try {
        const response = await axios.post(`${SKILLS_SERVICE_URL}/api/skills/validate`, { skillIds });
        return [response.status === 200, response.data];
    } catch (error) {
        return [false, null];
    }
};

export const validateLearningOutcomes = async (learningOutcomesIds: string[]): Promise<[boolean, any]> => {
    try {
        const response = await axios.post(`${SKILLS_SERVICE_URL}/api/learning-outcomes/validate`, { learningOutcomesIds });
        return [response.status === 200, response.data];;
    } catch (error) {
        return [false, null];
    }
};

export const createSkills = async (skills: any[]): Promise<{ _id: string, generated_id?: string }[]> => {
    try {
        const response = await axios.post(`${SKILLS_SERVICE_URL}/api/skills/bulk`, { skills });
        return response.data;
    } catch (error) {
        throw new Error('Error creating skills');
    }
};

export const createLearningOutcomes = async (outcomes: any[]): Promise<{ _id: string }[]> => {
    try {
        const response = await axios.post(`${SKILLS_SERVICE_URL}/api/learning-outcomes/bulk`, outcomes);
        return response.data;
    } catch (error) {
        throw new Error('Error creating learning outcomes');
    }
};