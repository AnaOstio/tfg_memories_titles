// tests/titleMemory.routes.test.ts

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TitleMemoryModel from '../models/titleMemory.model';
import app from '../app';
import { ITitleMemory } from '../interfaces/titleMemory.interface';
import { validateToken } from '../services/auth.services';

// ——— MOCK de validateToken ———
jest.mock('../services/auth.services', () => ({
    __esModule: true,
    validateToken: jest.fn(),
}));

let mongoServer: MongoMemoryServer;
let mongoUri: string;
const mongooseOpts = { useNewUrlParser: true, useUnifiedTopology: true } as mongoose.ConnectOptions;
const basePath = '/api/title-memories';
const validToken = 'valid-token';
const fakeUserId = 'user-123';

beforeAll(async () => {
    // Arranca in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, mongooseOpts);

    // validateToken siempre válido
    (validateToken as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: fakeUserId,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Limpia la colección antes de cada test
    await TitleMemoryModel.deleteMany({});
});

describe('📚 Rutas /api/title-memories (integración + auth mock)', () => {
    it('GET / → paginación por defecto (vacío)', async () => {
        const res = await request(app).get(basePath);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(10);
    });

    it('POST / → 401 sin token', async () => {
        const res = await request(app).post(basePath).send({});
        expect(res.status).toBe(401);
    });

    it('POST / → crea un TitleMemory con token', async () => {
        const payload: Partial<ITitleMemory> = {
            titleCode: 'T1',
            universities: ['U'],
            centers: ['C'],
            name: 'Test1',
            academicLevel: 'Lic',
            branch: 'B',
            academicField: 'AF',
            status: 'ok',
            yearDelivery: 2021,
            totalCredits: 60,
            distributedCredits: {},
            skills: [],
            learningOutcomes: [],
        };
        const res = await request(app)
            .post(basePath)
            .set('Authorization', `Bearer ${validToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.userId).toBe(fakeUserId);
        expect(await TitleMemoryModel.countDocuments()).toBe(1);
    });

    it('GET /:id → 404 si no existe', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`${basePath}/${fakeId}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    });

    it('GET /:id → obtiene por ID', async () => {
        const doc = await TitleMemoryModel.create({
            titleCode: 'T2',
            universities: ['U'],
            centers: ['C'],
            name: 'Test2',
            academicLevel: 'Lic',
            branch: 'B',
            academicField: 'AF',
            status: 'ok',
            yearDelivery: 2022,
            totalCredits: 60,
            distributedCredits: {},
            skills: [],
            learningOutcomes: [],
            userId: fakeUserId,
        } as unknown as ITitleMemory);

        const res = await request(app).get(`${basePath}/${doc._id}`);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Test2');
    });

    it('PUT /:id → 401 sin token', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).put(`${basePath}/${fakeId}`).send({ name: 'X' });
        expect(res.status).toBe(401);
    });

    it('PUT /:id → actualiza con token y 404 si no existe', async () => {
        const doc = await TitleMemoryModel.create({
            titleCode: 'T3',
            universities: ['U'],
            centers: ['C'],
            name: 'ToUpdate',
            academicLevel: 'Lic',
            branch: 'B',
            academicField: 'AF',
            status: 'ok',
            yearDelivery: 2023,
            totalCredits: 60,
            distributedCredits: {},
            skills: [],
            learningOutcomes: [],
            userId: fakeUserId,
        } as unknown as ITitleMemory);

        // Actualiza
        const res1 = await request(app)
            .put(`${basePath}/${doc._id}`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Updated' });
        expect(res1.status).toBe(200);
        expect(res1.body.name).toBe('Updated');

        // ID fake
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res2 = await request(app)
            .put(`${basePath}/${fakeId}`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'X' });
        expect(res2.status).toBe(404);
    });

    it('DELETE /:id → 401 sin token', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).delete(`${basePath}/${fakeId}`);
        expect(res.status).toBe(401);
    });

    it('DELETE /:id → elimina con token y 404 si no existe', async () => {
        const doc = await TitleMemoryModel.create({
            titleCode: 'T4',
            universities: ['U'],
            centers: ['C'],
            name: 'ToDelete',
            academicLevel: 'Lic',
            branch: 'B',
            academicField: 'AF',
            status: 'ok',
            yearDelivery: 2024,
            totalCredits: 60,
            distributedCredits: {},
            skills: [],
            learningOutcomes: [],
            userId: fakeUserId,
        } as unknown as ITitleMemory);

        // Borra real
        const res1 = await request(app)
            .delete(`${basePath}/${doc._id}`)
            .set('Authorization', `Bearer ${validToken}`);
        expect(res1.status).toBe(200);
        expect(res1.body.message).toMatch(/deleted successfully/i);
        expect(await TitleMemoryModel.exists({ _id: doc._id })).toBeFalsy();

        // Borra inexistente
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res2 = await request(app)
            .delete(`${basePath}/${fakeId}`)
            .set('Authorization', `Bearer ${validToken}`);
        expect(res2.status).toBe(404);
    });

    it('POST /bulk → 401 sin token', async () => {
        const res = await request(app).post(`${basePath}/bulk`).send([{}]);
        expect(res.status).toBe(401);
    });

    it('POST /bulk → crea bulk con token', async () => {
        const items = [{
            titleCode: 'B1',
            universities: ['U'],
            centers: ['C'],
            name: 'Bulk1',
            academicLevel: 'Lic',
            branch: 'B',
            academicField: 'AF',
            status: 'ok',
            yearDelivery: 2020,
            totalCredits: 60,
            distributedCredits: {},
            skills: [],
            learningOutcomes: [],
        }];
        const res = await request(app)
            .post(`${basePath}/bulk`)
            .set('Authorization', `Bearer ${validToken}`)
            .send(items);

        expect(res.status).toBe(201);
        expect(Array.isArray(res.body)).toBe(true);
        expect(await TitleMemoryModel.countDocuments()).toBe(1);
    });

    it('POST /search → 400 sin filtros, 200 con resultados', async () => {
        // 400
        let res = await request(app).post(`${basePath}/search`).send({});
        expect(res.status).toBe(400);

        // Inserto dos docs
        await TitleMemoryModel.insertMany([
            {
                titleCode: 'A', universities: ['U'], centers: ['C'], name: 'Alpha',
                academicLevel: 'Lic', branch: 'B', academicField: 'AF',
                status: 'ok', yearDelivery: 2020, totalCredits: 60,
                distributedCredits: {}, skills: [], learningOutcomes: [], userId: fakeUserId
            },
            {
                titleCode: 'B', universities: ['U'], centers: ['C'], name: 'Beta',
                academicLevel: 'Lic', branch: 'B', academicField: 'AF',
                status: 'ok', yearDelivery: 2021, totalCredits: 60,
                distributedCredits: {}, skills: [], learningOutcomes: [], userId: fakeUserId
            },
        ] as unknown as ITitleMemory[]);

        // 200
        res = await request(app)
            .post(`${basePath}/search`)
            .send({ filters: { titleName: ['Alpha'] } });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Alpha');
    });

    it('POST auxiliares → check-title, validate-skills, validate-lerning-outcomes', async () => {
        // check-title sin doc → 401
        let res = await request(app)
            .post(`${basePath}/check-title`)
            .send({ titleMemoryId: 'x', userId: 'u' });
        expect(res.status).toBe(500);

        // Creo doc con skills/outcomes
        const doc = await TitleMemoryModel.create({
            titleCode: 'X', universities: ['U'], centers: ['C'], name: 'X',
            academicLevel: 'Lic', branch: 'B', academicField: 'AF',
            status: 'ok', yearDelivery: 2025, totalCredits: 60,
            distributedCredits: {}, skills: ['s1'], learningOutcomes: [{ 'o1': ['s1'] }],
            userId: fakeUserId,
        } as unknown as ITitleMemory);

        // check-title OK
        res = await request(app)
            .post(`${basePath}/check-title`)
            .send({ titleMemoryId: doc._id, userId: fakeUserId });
        expect(res.status).toBe(200);

        // validate-skills KO y OK
        res = await request(app)
            .post(`${basePath}/validate-skills`)
            .send({ titleMemoryId: doc._id, skills: ['x'] });
        expect(res.status).toBe(500);
        res = await request(app)
            .post(`${basePath}/validate-skills`)
            .send({ titleMemoryId: doc._id, skills: ['s1'] });
        expect(res.status).toBe(200);

        // validate-outcomes KO y OK
        res = await request(app)
            .post(`${basePath}/validate-lerning-outcomes`)
            .send({ titleMemoryId: doc._id, learningOutcomes: ['x'] });
        expect(res.status).toBe(500);
        res = await request(app)
            .post(`${basePath}/validate-lerning-outcomes`)
            .send({ titleMemoryId: doc._id, learningOutcomes: ['o1'] });
        expect(res.status).toBe(200);
    });
});
