import { Router } from 'express';
import {
    bulkCreate, changeOutcomesSkills, checkTitleUser, create, createFromFiles, deleteMemory, getAll,
    getById, getByUserId, search, update, validateOutcomesFromTitle,
    validateSkillsFromTitle
} from '../controllers/titleMemoryController';
import { uploadMemory } from '../config/upload';

const router = Router();

// Rutas públicas
/**
* @openapi
* /title-memories:
*   get:
*     tags:
*       - TitleMemories
*     summary: Retrieve all title memories with pagination
*     parameters:
*       - in: query
*         name: page
*         schema:
*           type: integer
*           default: 1
*         description: Page number
*       - in: query
*         name: limit
*         schema:
*           type: integer
*           default: 10
*         description: Items per page
*     responses:
*       200:
*         description: A paginated list of title memories
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/TitleMemory'
*                 pagination:
*                   $ref: '#/components/schemas/Pagination'
*       500:
*         description: Internal server error
*/
router.get('/', getAll);

/**
 * @openapi
 * /title-memories/search:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Search title memories with filters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 $ref: '#/components/schemas/TitleMemoryFilterInput'
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 10
 *               fromUser:
 *                 type: boolean
 *             required:
 *               - filters
 *     responses:
 *       200:
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TitleMemory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad request (missing filters)
 *       500:
 *         description: Internal server error
 */
router.post('/search', search);

/**
 * @openapi
 * /title-memories/{id}:
 *   get:
 *     tags:
 *       - TitleMemories
 *     summary: Get a title memory by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Title memory ID
 *     responses:
 *       200:
 *         description: Title memory data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TitleMemory'
 *       404:
 *         description: Title memory not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getById);

// Rutas que requieren autenticación (se verifica en cada controlador)
/**
 * @openapi
 * /title-memories:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Create a new title memory (authenticated)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TitleMemoryInput'
 *     responses:
 *       201:
 *         description: Created title memory
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TitleMemory'
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       500:
 *         description: Internal server error
 */
router.post('/', create);

/**
 * @openapi
 * /title-memories/bulk:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Bulk create title memories (authenticated)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/TitleMemoryInput'
 *     responses:
 *       201:
 *         description: Created multiple title memories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TitleMemory'
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       500:
 *         description: Internal server error
 */
router.post('/bulk', bulkCreate);

router.put('/change-outcomes-skills', changeOutcomesSkills)

/**
 * @openapi
 * /title-memories/{id}:
 *   put:
 *     tags:
 *       - TitleMemories
 *     summary: Update an existing title memory (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Title memory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TitleMemoryInput'
 *     responses:
 *       200:
 *         description: Updated title memory
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TitleMemory'
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       404:
 *         description: Title memory not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', update);

/**
 * @openapi
 * /title-memories/{id}:
 *   delete:
 *     tags:
 *       - TitleMemories
 *     summary: Delete a title memory (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Title memory ID
 *     responses:
 *       200:
 *         description: Title memory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       404:
 *         description: Title memory not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteMemory);

/**
 * @openapi
 * /title-memories/user:
 *   get:
 *     tags:
 *       - TitleMemories
 *     summary: Get title memories for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A paginated list of user's title memories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TitleMemory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get('/user/memories', getByUserId);

/**
 * @openapi
 * /title-memories/check-user:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Check if a title belongs to a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleMemoryId:
 *                 type: string
 *               userId:
 *                 type: string
 *             required:
 *               - titleMemoryId
 *               - userId
 *     responses:
 *       200:
 *         description: Title exists for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Title does not belong to this user
 *       500:
 *         description: Internal server error
 */
router.post('/check-title', checkTitleUser);

/**
 * @openapi
 * /title-memories/validate-skills:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Validate that a title has certain skills
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleMemoryId:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - titleMemoryId
 *               - skills
 *     responses:
 *       200:
 *         description: Title has the specified skills
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Title does not have the specified skills
 *       500:
 *         description: Internal server error
 */
router.post('/validate-skills', validateSkillsFromTitle);

/**
 * @openapi
 * /title-memories/validate-outcomes:
 *   post:
 *     tags:
 *       - TitleMemories
 *     summary: Validate that a title has certain learning outcomes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleMemoryId:
 *                 type: string
 *               learningOutcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - titleMemoryId
 *               - learningOutcomes
 *     responses:
 *       200:
 *         description: Title has the specified learning outcomes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Title does not have the specified learning outcomes
 *       500:
 *         description: Internal server error
 */
router.post('/validate-lerning-outcomes', validateOutcomesFromTitle);

router.post('/from-file', uploadMemory.array('files'), createFromFiles);

export default router;