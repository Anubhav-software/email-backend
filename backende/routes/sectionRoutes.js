import express from 'express';
import { getSections, createSection, updateSection, deleteSection } from '../controllers/sectionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all sections
router.get('/', getSections);


router.post('/', authMiddleware, createSection);


router.put('/:id', authMiddleware, updateSection);


router.delete('/:id', authMiddleware, deleteSection);

export default router;
