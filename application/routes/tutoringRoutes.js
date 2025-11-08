import express from 'express';
const router = express.Router();
import { searchTutors } from '../controllers/tutoringController.js';

router.get('/search', searchTutors);

// health check
router.get('/ping', (req, res) => {
  res.json({ msg: 'Backend API is live! 🔥' });
});

export default router;