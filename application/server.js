import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Session Handling for auth/login
import session from "express-session";
import MySQLStore from "express-mysql-session";
// Database stuff i.e. our mysql.pool, which also triggers process.env population
import pool from "./config/db.js"; 
// Simple API routers connecting HTTP routes to their respective controllers.
import tutoringRoutes from './routes/tutoringRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import authRoutes from './routes/authRoutes.js'

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Session Handling (must be set up before routes)

// weird old school wrapper function that exports MySQLStore class
const SessionStoreClass = MySQLStore(session); 

// Once bound we can instantiate a new sessionStore object
const sessionStore = new SessionStoreClass({
  host: pool.host,
  port: pool.port,
  user: pool.user,
  password: pool.password,
  database: pool.database,
});

app.use(
  session({
    key: "gator_tutor_sid",
    secret: process.env.SESSION_SECRET || "gatortutorsecretabc123",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// API routes (after sessions built out)
app.use('/api', tutoringRoutes); // tutor results + health check
app.use('/api', bookingRoutes); // booking + book health check
app.use('/api/auth', authRoutes); // OTP verification, user sign-up/sign-in, future session handling?

// Nginx will pass HTTP requests to .env-specified port or 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
