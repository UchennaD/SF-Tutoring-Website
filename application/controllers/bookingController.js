// db.js already sets up pool using env values
import pool from '../config/db.js';

export async function bookSession(req, res) {
    const { student_id, tutor_id, session_id } = req.body;

    if (!student_id || !tutor_id || !session_id) {
        return res
            .status(400)
            .json({ success: false, error: "Missing required fields." });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO bookings (student_id, tutor_id, session_id)
             VALUES (?, ?, ?)`,
            [student_id, tutor_id, session_id]
        );
        // remove session from results page (by marking 'booked' boolean as true)
        await pool.query(
            `UPDATE tutoring_sessions 
            SET is_booked = 1 
            WHERE id = ?`,
            [session_id]
        );

        res.json({ success: true, booking_id: result.insertId });

    } catch (err) {
        console.error("Error during booking:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}