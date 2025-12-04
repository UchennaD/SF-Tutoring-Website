import express from 'express';
const router = express.Router();
import { upcomingSessions } from '../controllers/dashboardController';

router.get('/upcoming-sessions/:student_id', upcomingSessions);

export default router;