import axios from 'axios';

const SUBJECTS_SERVICE_URL = process.env.SUBJECTS_SERVICE_URL || 'http://localhost:3002';

export const changeStatusSubjects = async (token: string, data: any): Promise<any> => {
    try {
        const response = await axios.put(`${SUBJECTS_SERVICE_URL}/api/subjects/change-status/${data.titleMemoryId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data
    } catch (error) {
        return { isValid: false };
    }
};
