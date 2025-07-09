import axios from 'axios';

const USERS_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';

export const getPermissionsByUser = async (token: string): Promise<any> => {
    try {
        const response = await axios.get(`${USERS_SERVICE_URL}/permissions/getByUserId`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data
    } catch (error) {
        return { isValid: false };
    }
};
