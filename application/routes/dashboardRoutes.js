import express from 'express';
const router = express.Router();
import { getStudentProfile, upcomingSessions, updateStudentProfile } from '../controllers/dashboardController';

router.get('/upcoming-sessions/:student_id', upcomingSessions);

// TO DO: IMPLEMENT ROUTES for new controllers -- double check url format

// NOTE: I'm not sure if we need to append 'student_id' or other info in the fetch URL, 
// since the backend can check via req.session.user (or req.user if we end up implementing that in middleware) 
// or even:  const { newName, newProfilePic, newBio } = req.body;   – Jamie

router.get('/student-profile/', getStudentProfile); // haven't verified 
router.post('/update-student-profile', updateStudentProfile); // haven't verified

export default router;