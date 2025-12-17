import express from 'express';
const router = express.Router();
import { getProfile, upcomingSessions, updateProfile } from '../controllers/dashboardController.js';

router.get('/upcoming-sessions', upcomingSessions);

// TO DO: IMPLEMENT ROUTES for new controllers -- double check url format
router.get('upcoming-sessions', upcomingSessions);

// NOTE: I'm not sure if we need to append 'student_id' or other info in the fetch URL, 
// since the backend can check via req.session.user (or req.user if we end up implementing that in middleware) 
// or even:  const { newName, newProfilePic, newBio } = req.body;   – Jamie

//Profile routes
router.get('/profile', getProfile); // needs testing
router.post('/profile', updateProfile); // needs testing

export default router;