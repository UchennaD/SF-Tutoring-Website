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
      `SELECT 
          ts.*,
          s.full_name AS tutor_name_real,
          t.rating AS tutor_rating_real
       FROM tutoring_sessions ts
       JOIN tutors t ON ts.tutor_id = t.tutor_id
       JOIN students s ON t.tutor_id = s.id
       WHERE
         (? = '' OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(ts.subjects, '$')))
           LIKE LOWER(CONCAT('%', ?, '%')))
         AND (? = '' OR ts.mode = ?)
         AND (? = '' OR t.rating >= ?)
         AND (? IS NULL OR ts.session_date = ?)
         AND ts.is_booked = 0`,
      [
        subject, subject,
        mode, mode,
        minrating, safeRating,
        safeDate, safeDate
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
        subjects: parsedSubjects,
        tutor_name_real: r.tutor_name_real,
        tutor_rating_real: r.tutor_rating_real
      };
    });

    res.json(fixedRows);
  } catch (err) {
    console.error("Error during tutor search:", err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
