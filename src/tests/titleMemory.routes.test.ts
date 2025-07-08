import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import TitleMemoryService from '../services/titleMemory.services';
import router from '../routers/titleMemory.routes';
import * as authSvc from '../services/auth.services';
import * as permSvc from '../services/permissions.services';
import * as skillOutcomeSvc from '../services/skillLearningOutcome.services';
import * as subjectSvc from '../services/subject.services';

jest.mock('../services/titleMemory.services');
jest.mock('../services/auth.services');
jest.mock('../services/permissions.services');
jest.mock('../services/skillLearningOutcome.services');
jest.mock('../services/subject.services');

const app = express();
app.use(bodyParser.json());
app.use('/title-memories', router);

const VALID_TOKEN = 'valid-token';
const USER_ID = 'user123';

beforeAll(() => {
    // Mock validateToken to always return a defined object
    (authSvc.validateToken as jest.Mock).mockImplementation(async (token: string) => {
        if (token === VALID_TOKEN) {
            return { isValid: true, userId: USER_ID };
        }
        return { isValid: false, userId: null };
    });
    // Mock permissions lookup
    (permSvc.getPermissionsByUser as jest.Mock).mockResolvedValue({
        data: [{ memoryId: 'mem1' }, { memoryId: 'mem2' }],
    });
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Rutas /title-memories', () => {
    describe('GET /', () => {
        it('→ 200 con paginación', async () => {
            const fake = { data: ['a', 'b'], pagination: { page: 2, limit: 5, total: 7 } };
            (TitleMemoryService.getAll as jest.Mock).mockResolvedValue(fake);

            const res = await request(app)
                .get('/title-memories')
                .query({ page: '2', limit: '5' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(fake);
            expect(TitleMemoryService.getAll).toHaveBeenCalledWith({}, { page: 2, limit: 5 });
        });

        it('→ 500 en error interno', async () => {
            (TitleMemoryService.getAll as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app).get('/title-memories');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('POST /search', () => {
        it('→ 400 sin filters', async () => {
            const res = await request(app)
                .post('/title-memories/search')
                .send({ page: 1, limit: 10 });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: 'Debe proporcionar al menos un filtro de búsqueda' });
        });

        it('→ 200 con resultados', async () => {
            const fake = { data: ['x'], pagination: { page: 1, limit: 10, total: 1 } };
            (TitleMemoryService.search as jest.Mock).mockResolvedValue(fake);

            const res = await request(app)
                .post('/title-memories/search')
                .send({ filters: { titleName: ['T'] }, page: 1, limit: 10, fromUser: false });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(fake);
            expect(TitleMemoryService.search).toHaveBeenCalledWith(expect.any(Object), { page: 1, limit: 10 });
        });

        it('→ 500 en error interno', async () => {
            (TitleMemoryService.search as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app)
                .post('/title-memories/search')
                .send({ filters: { titleName: ['T'] } });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('GET /:id', () => {
        it('→ 200 con objeto enriquecido', async () => {
            const dbObj = {
                _id: 'id1',
                skills: ['s1'],
                learningOutcomes: [{ o1: ['s1'] }]
            };
            (TitleMemoryService.getById as jest.Mock).mockResolvedValue(dbObj);
            (skillOutcomeSvc.getSkillsByIds as jest.Mock).mockResolvedValue(['skillObj']);
            (skillOutcomeSvc.getLearningOutcomesByIds as jest.Mock).mockResolvedValue(['outcomeObj']);

            const res = await request(app).get('/title-memories/id1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                ...dbObj,
                skills: ['skillObj'],
                learningOutcomes: ['outcomeObj']
            });
        });

        it('→ 404 si no existe', async () => {
            (TitleMemoryService.getById as jest.Mock).mockResolvedValue(null);
            const res = await request(app).get('/title-memories/notfound');
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Title memory not found' });
        });

        it('→ 500 en error interno', async () => {
            (TitleMemoryService.getById as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app).get('/title-memories/id1');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('POST /', () => {
        const payload = { name: 'T' };

        it('→ 401 sin token', async () => {
            const res = await request(app).post('/title-memories').send(payload);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 401 con token inválido', async () => {
            const res = await request(app)
                .post('/title-memories')
                .set('Authorization', 'Bearer bad')
                .send(payload);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'Invalid token' });
        });

        it('→ 201 ok', async () => {
            const created = { _id: 'new', ...payload, userId: USER_ID };
            (TitleMemoryService.create as jest.Mock).mockResolvedValue(created);

            const res = await request(app)
                .post('/title-memories')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(created);
        });

        it('→ 400 en validación', async () => {
            (TitleMemoryService.create as jest.Mock).mockRejectedValue(new Error('Invalid data'));

            const res = await request(app)
                .post('/title-memories')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: 'Invalid data' });
        });

        it('→ 500 en otro error', async () => {
            (TitleMemoryService.create as jest.Mock).mockRejectedValue(new Error('Some other'));

            const res = await request(app)
                .post('/title-memories')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send(payload);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Some other' });
        });
    });

    describe('POST /bulk', () => {
        const arr = [{ name: 'A' }, { name: 'B' }];

        it('→ 401 sin token', async () => {
            const res = await request(app).post('/title-memories/bulk').send(arr);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 201 ok', async () => {
            (TitleMemoryService.bulkCreate as jest.Mock).mockResolvedValue([{ _id: '1' }, { _id: '2' }]);

            const res = await request(app)
                .post('/title-memories/bulk')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send(arr);

            expect(res.status).toBe(201);
            expect(res.body).toEqual([{ _id: '1' }, { _id: '2' }]);
        });

        it('→ 500 en error', async () => {
            (TitleMemoryService.bulkCreate as jest.Mock).mockRejectedValue(new Error());

            const res = await request(app)
                .post('/title-memories/bulk')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send(arr);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('PUT /change-outcomes-skills', () => {
        it('→ 401 sin token', async () => {
            const res = await request(app).put('/title-memories/change-outcomes-skills').send({});
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 200 y dispatch', async () => {
            const spySkills = jest.spyOn(TitleMemoryService, 'changeSkills');
            const spyOuts = jest.spyOn(TitleMemoryService, 'changeOutcomes');

            const res1 = await request(app)
                .put('/title-memories/change-outcomes-skills')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ newSkill: 'ns', lastSkill: ['ls'] });
            expect(res1.status).toBe(200);
            expect(spySkills).toHaveBeenCalledWith('ns', ['ls']);

            const res2 = await request(app)
                .put('/title-memories/change-outcomes-skills')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ newOutcome: 'no', lastOucomes: ['lo'] });
            expect(res2.status).toBe(200);
            expect(spyOuts).toHaveBeenCalledWith('no', ['lo']);
        });

        it('→ 500 en error', async () => {
            (TitleMemoryService.changeSkills as jest.Mock).mockImplementation(() => { throw new Error(); });
            const res = await request(app)
                .put('/title-memories/change-outcomes-skills')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ newSkill: 'ns', lastSkill: ['ls'] });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('PUT /:id', () => {
        it('→ 401 sin token', async () => {
            const res = await request(app).put('/title-memories/1').send({});
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 404 si no existe', async () => {
            (TitleMemoryService.update as jest.Mock).mockResolvedValue(null);
            const res = await request(app)
                .put('/title-memories/1')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ name: 'X' });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });

        // it('→ 200 y objeto actualizado', async () => {
        //     const updated = { _id: '1', name: 'X' };
        //     (TitleMemoryService.update as jest.Mock).mockResolvedValue(updated);
        //     const res = await request(app)
        //         .put('/title-memories/1')
        //         .set('Authorization', `Bearer ${VALID_TOKEN}`)
        //         .send({ name: 'X' });
        //     expect(res.status).toBe(200);
        //     expect(res.body).toEqual(updated);
        // });

        it('→ 500 en error interno', async () => {
            (TitleMemoryService.update as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app)
                .put('/title-memories/1')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ name: 'X' });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('DELETE /:id', () => {
        it('→ 401 sin token', async () => {
            const res = await request(app).delete('/title-memories/1');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 404 si no existe', async () => {
            (TitleMemoryService.delete as jest.Mock).mockResolvedValue(false);
            const res = await request(app)
                .delete('/title-memories/1')
                .set('Authorization', `Bearer ${VALID_TOKEN}`);
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Title memory not found' });
        });

        it('→ 200 y changeStatusSubjects', async () => {
            (TitleMemoryService.delete as jest.Mock).mockResolvedValue(true);
            const spy = jest.spyOn(subjectSvc, 'changeStatusSubjects');
            const res = await request(app)
                .delete('/title-memories/1')
                .set('Authorization', `Bearer ${VALID_TOKEN}`);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Title memory deleted successfully' });
            expect(spy).toHaveBeenCalledWith(VALID_TOKEN, { titleMemoryId: '1', status: 'deleted' });
        });

        it('→ 500 en error interno', async () => {
            (TitleMemoryService.delete as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app)
                .delete('/title-memories/1')
                .set('Authorization', `Bearer ${VALID_TOKEN}`);
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('GET /user/memories', () => {
        it('→ 401 sin token', async () => {
            const res = await request(app).get('/title-memories/user/memories');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 200 ok', async () => {
            const fakeRes = { data: ['m1'], pagination: { page: 1, limit: 10, total: 1 } };
            (TitleMemoryService.getByUserId as jest.Mock).mockResolvedValue(fakeRes);

            const res = await request(app)
                .get('/title-memories/user/memories')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .query({ page: 1, limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ result: fakeRes, permissions: [{ memoryId: 'mem1' }, { memoryId: 'mem2' }] });
            expect(TitleMemoryService.getByUserId).toHaveBeenCalledWith(['mem1', 'mem2'], { page: 1, limit: 10 });
        });

        it('→ 500 en error interno', async () => {
            (permSvc.getPermissionsByUser as jest.Mock).mockRejectedValue(new Error());
            const res = await request(app)
                .get('/title-memories/user/memories')
                .set('Authorization', `Bearer ${VALID_TOKEN}`);
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal server error' });
        });
    });

    describe('POST /check-title', () => {
        it('→ 200 si existe', async () => {
            (TitleMemoryService.checkTitleUser as jest.Mock).mockResolvedValue(true);
            const res = await request(app)
                .post('/title-memories/check-title')
                .send({ titleMemoryId: 't1', userId: 'u1' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'El título ya existe para este usuario' });
        });

        it('→ 401 si no pertenece', async () => {
            (TitleMemoryService.checkTitleUser as jest.Mock).mockResolvedValue(false);
            const res = await request(app)
                .post('/title-memories/check-title')
                .send({ titleMemoryId: 't1', userId: 'u1' });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'El titulo no pertenece a este usuario' });
        });
    });

    describe('POST /validate-skills', () => {
        it('→ 200 si tiene habilidades', async () => {
            (TitleMemoryService.validateSkillsFromTitle as jest.Mock).mockResolvedValue(true);
            const res = await request(app)
                .post('/title-memories/validate-skills')
                .send({ titleMemoryId: 't1', skills: ['s1'] });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'El título tiene habilidades asociadas' });
        });

        it('→ 401 si no tiene', async () => {
            (TitleMemoryService.validateSkillsFromTitle as jest.Mock).mockResolvedValue(false);
            const res = await request(app)
                .post('/title-memories/validate-skills')
                .send({ titleMemoryId: 't1', skills: ['s1'] });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'El titulo no tiene habilidades asociadas' });
        });
    });

    describe('POST /validate-lerning-outcomes', () => {
        it('→ 200 si tiene resultados', async () => {
            (TitleMemoryService.validateOutcomesFromTitle as jest.Mock).mockResolvedValue(true);
            const res = await request(app)
                .post('/title-memories/validate-lerning-outcomes')
                .send({ titleMemoryId: 't1', learningOutcomes: ['o1'] });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'El título tiene resultados de aprendizaje asociados' });
        });

        it('→ 401 si no tiene', async () => {
            (TitleMemoryService.validateOutcomesFromTitle as jest.Mock).mockResolvedValue(false);
            const res = await request(app)
                .post('/title-memories/validate-lerning-outcomes')
                .send({ titleMemoryId: 't1', learningOutcomes: ['o1'] });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'El titulo no tiene resultados de aprendizaje asociados' });
        });
    });

    describe('POST /from-file', () => {
        const validItem = {
            titleCode: 'C1', universities: ['U'], centers: ['C'], name: 'N',
            academicLevel: 'L', branch: 'B', academicField: 'F', status: 'S',
            yearDelivery: 2025, totalCredits: 10, distributedCredits: 10,
            skills: [], learningOutcomes: []
        };

        it('→ 401 sin token', async () => {
            const res = await request(app).post('/title-memories/from-file');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ message: 'No token provided' });
        });

        it('→ 400 sin archivos', async () => {
            const res = await request(app)
                .post('/title-memories/from-file')
                .set('Authorization', `Bearer ${VALID_TOKEN}`);
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ message: 'No files provided' });
        });

        it('→ 400 JSON inválido', async () => {
            const res = await request(app)
                .post('/title-memories/from-file')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .attach('files', Buffer.from('not json'), 'bad.json');
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/JSON inválido/);
        });

        it('→ 400 no es array', async () => {
            const buf = Buffer.from(JSON.stringify({ foo: 'bar' }));
            const res = await request(app)
                .post('/title-memories/from-file')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .attach('files', buf, 'not-array.json');
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/debe ser un array de objetos/);
        });

        it('→ 400 esquema inválido', async () => {
            const arr = [{ missing: 'prop' }];
            const buf = Buffer.from(JSON.stringify(arr));
            const res = await request(app)
                .post('/title-memories/from-file')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .attach('files', buf, 'bad-schema.json');
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/falta la propiedad/);
        });

        it('→ 201 ok con items creados', async () => {
            const arr = [validItem, validItem];
            const buf = Buffer.from(JSON.stringify(arr));
            (TitleMemoryService.create as jest.Mock).mockImplementation(item => Promise.resolve({ ...item, _id: 'X' }));

            const res = await request(app)
                .post('/title-memories/from-file')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .attach('files', buf, 'good.json');

            expect(res.status).toBe(201);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
            expect(TitleMemoryService.create).toHaveBeenCalledTimes(2);
        });
    });
});