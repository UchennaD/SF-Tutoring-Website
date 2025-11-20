import express from 'express';
const router = express.Router();
import { bookSession } from '../controllers/bookingController.js';

router.post('/book', bookSession);

// health check
router.post('/book/health', (req, res) => {
  res.json({ msg: 'Book API is live! 🔥' });
});

export default router;