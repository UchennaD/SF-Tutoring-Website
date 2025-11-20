// DB Pool setup and connection using .env already handled in config/db.js 
import pool from '../config/db.js';

export async function searchTutors(req, res) {
  const { subject, mode, minrating, date } = req.query;

  try {
    // Since the pool is already configured to the 'db14' database,
    // we only need to specify the table, 'tutoring_sessions'
    // Our queary just searches for matching terms, except with min_rating, where we look for *greater* values. 
    
    // Bug fixes & error prevention
    const safeDate = date === '' ? null : date;
    const safeRating = minrating === '' ? null : Number(minrating);

    // capitalization agnostic, filter optional SQL query
    const [rows] = await pool.query(
      `SELECT *
      FROM tutoring_sessions
      WHERE
        (? = '' OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(subjects, '$')))
        LIKE LOWER(CONCAT('%', ?, '%')))
        AND (? = '' OR mode = ?)
        AND (? = '' OR tutor_rating >= ?)
        AND (? IS NULL OR session_date = ?)
        AND is_booked = 0`,
      [
      subject, subject,
      mode, mode,
      minrating, safeRating,
      safeDate, safeDate,
      ]
    );
     // Parse the JSON subjects field into a proper JS array
    const fixedRows = rows.map(r => {
      let parsedSubjects;

      try {
        // if subjects are stored properly as json 
        parsedSubjects = JSON.parse(r.subjects);
        if (!Array.isArray(parsedSubjects)) {
          parsedSubjects = [parsedSubjects];
        }
      } catch {
        // default if subjects are just strings
        parsedSubjects = [r.subjects];
      }

      return {
        ...r,
        subjects: parsedSubjects
      };
    });

    res.json(fixedRows);
  } catch (err) {
    console.error("Error during tutor search:", err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
