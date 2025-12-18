import express from 'express';
const router = express.Router();
import { bookSession, cancelSession } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.post('/book', requireAuth, bookSession);
router.delete('/book', requireAuth, cancelSession)

// health check
router.post('/book/health', (_req, res) => {
  res.json({ msg: 'Book API is live! 🔥' });
});

export default router;