/**
 * @openapi
 * components:
 *   schemas:
 *     TitleMemory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Identifier
 *         titleCode:
 *           type: string
 *         universities:
 *           type: array
 *           items:
 *             type: string
 *         centers:
 *           type: array
 *           items:
 *             type: string
 *         name:
 *           type: string
 *         academicLevel:
 *           type: string
 *         branch:
 *           type: string
 *         academicField:
 *           type: string
 *         status:
 *           type: string
 *         yearDelivery:
 *           type: integer
 *         totalCredits:
 *           type: integer
 *         distributedCredits:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         learningOutcomes:
 *           type: array
 *           items:
 *             type: string
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - _id
 *         - titleCode
 *         - name
 *
 *     TitleMemoryInput:
 *       type: object
 *       properties:
 *         titleCode:
 *           type: string
 *         universities:
 *           type: array
 *           items:
 *             type: string
 *         centers:
 *           type: array
 *           items:
 *             type: string
 *         name:
 *           type: string
 *         academicLevel:
 *           type: string
 *         branch:
 *           type: string
 *         academicField:
 *           type: string
 *         status:
 *           type: string
 *         yearDelivery:
 *           type: integer
 *         totalCredits:
 *           type: integer
 *         distributedCredits:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         learningOutcomes:
 *           type: array
 *           items:
 *             type: string
 *       required:
 *         - titleCode
 *         - name
 *
 *     TitleMemoryFilterInput:
 *       type: object
 *       properties:
 *         titleName:
 *           type: array
 *           items:
 *             type: string
 *         academicLevel:
 *           type: array
 *           items:
 *             type: string
 *         academicFields:
 *           type: array
 *           items:
 *             type: string
 *         branchAcademic:
 *           type: array
 *           items:
 *             type: string
 *         universities:
 *           type: array
 *           items:
 *             type: string
 *         centers:
 *           type: array
 *           items:
 *             type: string
 *         year:
 *           type: array
 *           items:
 *             type: integer
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         totalPages:
 *           type: integer
 */
