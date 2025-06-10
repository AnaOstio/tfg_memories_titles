import dotenv from 'dotenv';
dotenv.config();


export const PORT = process.env.PORT || 3001;

if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida en el archivo .env');
}

export const MONGODB_URI = process.env.MONGODB_URI as string;
export const NODE_ENV = process.env.NODE_ENV || 'development';