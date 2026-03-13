import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { categoryController } from './category.controller.js';
import { createCategorySchema } from './category.schema.js';
import { validate } from '../../middlewares/validate.js';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.post('/', requireAuth(), validate(createCategorySchema), categoryController.createCategory);

export default router;
