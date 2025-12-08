import express from 'express';
const router = express.Router();
import { createConvo, sendMessage, getConvos, getMessages } from '../controllers/messagingController.js';

// Conversation creation & retrieval
router.post('/convos', createConvo);
router.get('/convos/:convo_id', getConvos);

// Message creation & retrieval
router.post('/messages', sendMessage);
router.get('/convos/:convo_id/messages', getMessages);

// Chat health check
router.get('/chat/health', (_req, res) => {
  res.json({ msg: 'Messaging API is live! 💃🏻' });
});

export default router;