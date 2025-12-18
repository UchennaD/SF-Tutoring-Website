// db.js already sets up pool using env values
import pool from '../config/db.js';

export async function bookSession(req, res) {

    // Get identifying session details 

    const { tutor_id, session_id } = req.body;

    // Ensure legit session details
    if ( !tutor_id || !session_id) {
        return res
            .status(400)
            .json({ success: false, error: "Missing required fields." });
    }

    // User must be logged in to book, so we can access student.id through req.user.id or session
    const student_id = req.user.id; // we know req.user has just been initialized by authMiddleware (so we can use it)

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

// DELETE /api/book
export async function cancelSession(req, res){

    const tutorId = req.session.user?.id;
    const { booking_id, session_id } = req.body;
    
    if (!tutorId) {
        return res.status(401).json({ 
            success: false, 
            error: "Please log in as a tutor" 
        });
    }
    
    try {
        // Only allow tutors to delete their own bookings
        const [bookingsResult] = await pool.execute(
            `DELETE FROM bookings 
            WHERE booking_id = ? 
            AND tutor_id = ?`, 
            [booking_id, tutorId]
        );
        
        if (bookingsResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Booking not found or associated with a different tutor' 
            });
        }

         const [sessionsResult] = await pool.execute(
            `UPDATE tutoring_sessions 
            SET is_booked = 0
            WHERE id = ? 
            AND tutor_id = ?`, 
            [session_id, tutorId]
        );
        
        if (sessionsResult.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Session not found or logged to different tutor' 
            });
        }
        
        res.json({ success: true, message: 'Booking successfully cancelled' });
    } catch (error) {
        console.error('Error cancelling booked session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}