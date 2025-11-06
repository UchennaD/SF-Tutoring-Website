import express from 'express';
const router = express.Router();
import { searchTutors } from '../controllers/tutoringController.js';

router.get('/search', searchTutors);

export default router;