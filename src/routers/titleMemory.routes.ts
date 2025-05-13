import { Router } from 'express';
import TitleMemoryController from '../controllers/titleMemoryController';

const router = Router();

// Rutas públicas
router.get('/', TitleMemoryController.getAll);
router.post('/search', TitleMemoryController.search);
router.get('/:id', TitleMemoryController.getById);

// Rutas que requieren autenticación (se verifica en cada controlador)
router.post('/', TitleMemoryController.create);
router.post('/bulk', TitleMemoryController.bulkCreate);
router.put('/:id', TitleMemoryController.update);
router.delete('/:id', TitleMemoryController.delete);
router.get('/user/memories', TitleMemoryController.getByUserId);

export default router;