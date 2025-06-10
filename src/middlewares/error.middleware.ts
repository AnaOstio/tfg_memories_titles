import { Request, Response, NextFunction } from 'express';
import Logger from '../config/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    Logger.error(`Error en ${req.method} ${req.path}: ${err.stack}`);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    Logger.warn(`Ruta no encontrada: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
};