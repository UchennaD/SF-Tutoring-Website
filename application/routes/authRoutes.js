import express from 'express';
const router = express.Router();
import { emailOTP, verifyOTP, addStudent, addTutor, login, logout, session } from '../controllers/authControllers.js';

// OTP email authentication endpoint
router.get('/email', emailOTP);
// OTP Check via database
router.post('/verify', verifyOTP);
// Add Student (only after OTP success, so no erroneous DB entries)
router.post('/students', addStudent);
// Add Tutor (only after creating a student account)
router.post('/tutors', addTutor);
// Login: Verify email + password, implement session
router.post('/login', login);
// Logout: Clear session & remove session from DB. REDIRECT NOT INCLUDED
router.post('/logout', logout);
// Retrieve user info tied to session ID
router.get('/session', session);

// health check for auth section
router.get('/health', (_req, res) => {
  res.json({ msg: 'Hello from Auth API! 🔥' });
});

export default router;