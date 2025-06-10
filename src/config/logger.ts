import winston from 'winston';
import path from 'path';
import { NODE_ENV } from './env';
import DailyRotateFile from 'winston-daily-rotate-file';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error'
    }),
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/all.log')
    }),
    new DailyRotateFile({
        filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    })
];

const Logger = winston.createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'warn',
    levels,
    format,
    transports
});

export default Logger;