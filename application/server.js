import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import tutoringRoutes from './routes/tutoringRoutes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API routes
app.use('/api', tutoringRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
