// DB Pool setup and connection using .env already handled in config/db.js 
import pool from '../config/db.js';

export async function searchTutors(req, res) {
  const { subject, mode, minrating, date } = req.query;

  try {

    // Since the pool is already configured to the 'db14' database,
    // we only need to specify the table, 'tutoring_sessions'
    // Our queary just searches for matching terms, except with min_rating, where we look for *greater* values. 
    const [rows] = await pool.query(
      `SELECT * FROM tutoring_sessions 
       WHERE (? = '' OR JSON_CONTAINS(subjects, JSON_ARRAY(?)))
         AND (? = '' OR mode = ?)
         AND (? = '' OR tutor_rating >= ?)
         AND (? = '' OR session_date = ?)`,
      [subject, subject, mode, mode, minrating, minrating, date, date]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error during tutor search:", err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
