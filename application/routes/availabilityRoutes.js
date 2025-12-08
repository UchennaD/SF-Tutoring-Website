import express from 'express';
const router = express.Router();
import { 
    getTutorAvailability, 
    addTutorAvailability, 
    removeTutorAvailability,
    getTutorDashboard 
} from '../controllers/tutorController.js';

// All routes use session for tutor ID (Jamie's approach)
router.get('/availability', getTutorAvailability);
router.post('/availability', addTutorAvailability);
router.delete('/availability/:sessionId', removeTutorAvailability);
router.get('/dashboard', getTutorDashboard);

// Health check
router.get('/ping', (req, res) => {
    res.json({ msg: 'Tutor API is live! 🎓' });
});

export default router;