import axios from 'axios';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3000';

export const validateToken = async (token: string): Promise<{ isValid: boolean; userId?: string }> => {
    try {
        const response = await axios.get(`${USERS_SERVICE_URL}/api/auth/verify-token`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { isValid: true, userId: response.data.user._id };
    } catch (error) {
        return { isValid: false };
    }
};
