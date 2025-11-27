import express from 'express';
const router = express.Router();
import { emailOTP, verifyOTP, addUser, login } from '../controllers/authControllers.js';

// OTP email authentication endpoint
router.get('/email', emailOTP);
// OTP Check via database
router.post('/verify', verifyOTP);
// Add User (only after OTP success, so no erroneous DB entries)
router.post('/create', addUser);
// Login: Verify email + password, implement session
// TO-DO: Associated authControllers.js login function
router.post("/login", login);


// health check for auth section
router.get('/health', (req, res) => {
  res.json({ msg: 'Hello from Auth API! 🔥' });
});

export default router;