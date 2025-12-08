import express from 'express';
const router = express.Router();
import { searchTutors } from '../controllers/tutoringController.js';

router.get('/search', searchTutors);

// health check
router.get('/search/health', (_req, res) => {
  res.json({ msg: 'Search API is live! 🔥' });
});

export default router;