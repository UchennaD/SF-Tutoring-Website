import express from 'express';
const router = express.Router();
import { getProfile, upcomingSessions, updateProfile } from '../controllers/dashboardController.js';

router.get('/upcoming-sessions', upcomingSessions);


//Profile routes
router.get('/profile', getProfile); // needs testing
router.post('/profile', updateProfile); // needs testing

export default router;