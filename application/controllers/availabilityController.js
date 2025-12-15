import pool from '../config/db.js';

// Helper function to generate recurring dates
function generateRecurringDates(dayOfWeek, weeksAhead = 4) {
    const dates = [];
    const dayMap = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
        'Sunday': 0
    };
    const today = new Date();
    const targetDay = dayMap[dayOfWeek];

    for (let week = 0; week < weeksAhead; week++) {
        const date = new Date();
        const currentDay = date.getDay();
        let dayUntilTarget = (targetDay - currentDay + 7) % 7;

        if (week === 0 && dayUntilTarget === 0) {
            dayUntilTarget = 7; // Skip to next week if today is the target day
        }

        date.setDate(today.getDate() + dayUntilTarget + (week * 7));
        dates.push(date);
    }
    
    return dates;
}

// GET /api/tutor/availability
export async function getTutorAvailability(req, res) {
    // Get's tutor ID from session instead of availability table
    const tutorId = req.session.userId || req.session.tutorId;

    if (!tutorId) {
        return res.status(401).json({ 
            success: false,
            error: 'Please log in as tutor to view availability' });
    }

    try {
            const [sessions] = await pool.execute(
                `SELECT id, session_date, time_slot, subjects, mode, description 
                FROM tutoring_sessions 
                WHERE tutor_id = ? 
                AND is_booked = 0 
                AND session_date >= CURDATE()
                ORDER BY session_date, time_slot`,
                [tutorId]
            );

            res.json({ success: true, availability: sessions });
    } catch (error) {
        console.error('Error fetching tutor availability:', error);
        res.status(500).json({ 
            success: false,
            error: 'An error occurred while fetching availability' 
        });
    }
}

// POST /api/tutor/availability
export async function addTutorAvailability(req, res) {
    const tutorId = req.session.tutorId || req.session.userId;
    
    if (!tutorId) {
        return res.status(401).json({ 
            success: false, 
            error: "Please log in as a tutor to add availability" 
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            time_slot,
            subjects,
            mode,
            description,
            is_recurring, 
            specific_date, 
            day_of_week 
        } = req.body;
        
        // Get tutor info for the session records
        const [tutorInfo] = await connection.execute(
            `SELECT DISTINCT tutor_name, tutor_rating, image_url 
             FROM tutoring_sessions 
             WHERE tutor_id = ? 
             LIMIT 1`,
            [tutorId]
        );
        
        // If no existing sessions, get from users/tutors table
        let tutorData;
        if (tutorInfo.length > 0) {
            tutorData = tutorInfo[0];
        } else {
            // Fallback - you might need to adjust based on your users table structure
            const [userInfo] = await connection.execute(
                `SELECT name FROM users WHERE id = ?`,
                [tutorId]
            );
            tutorData = {
                tutor_name: userInfo[0]?.name || 'Tutor',
                tutor_rating: 0.0,
                image_url: 'images/default.png'
            };
        }
        
        const sessionDates = [];
        
        if (is_recurring) {
            const dates = generateRecurringDates(day_of_week, 4);
            sessionDates.push(...dates);
        } else {
            sessionDates.push(new Date(specific_date));
        }
        
        let insertedCount = 0;
        let skippedCount = 0;
        
        for (const date of sessionDates) {
            const sessionDate = date.toISOString().split('T')[0];
            
            // Check for existing slot
            const [existing] = await connection.execute(
                `SELECT id FROM tutoring_sessions 
                 WHERE tutor_id = ? 
                 AND session_date = ? 
                 AND time_slot = ?`,
                [tutorId, sessionDate, time_slot]
            );
            
            if (existing.length > 0) {
                skippedCount++;
                continue;
            }
            
            // Insert new session
            await connection.execute(
                `INSERT INTO tutoring_sessions 
                 (tutor_name, subjects, mode, session_date, time_slot, 
                  tutor_rating, description, image_url, is_booked, tutor_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
                [
                    tutorData.tutor_name,
                    subjects || '["General"]',
                    mode || 'Online',
                    sessionDate,
                    time_slot,
                    tutorData.tutor_rating,
                    description || 'Available for tutoring',
                    tutorData.image_url,
                    tutorId
                ]
            );
            insertedCount++;
        }
        
        await connection.commit();
        
        let message = `Created ${insertedCount} session(s)`;
        if (skippedCount > 0) {
            message += ` (${skippedCount} slots already existed)`;
        }
        
        res.json({ success: true, message });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error adding availability:', error);
        res.status(500).json({ success: false, error: 'Failed to add availability' });
    } finally {
        connection.release();
    }
}

// DELETE /api/tutor/availability/:sessionId
export async function removeTutorAvailability(req, res) {
    const tutorId = req.session.tutorId || req.session.userId;
    const { sessionId } = req.params;
    
    if (!tutorId) {
        return res.status(401).json({ 
            success: false, 
            error: "Please log in as a tutor" 
        });
    }
    
    try {
        // Only allow tutors to delete their own unbooked sessions
        const [result] = await pool.execute(
            `DELETE FROM tutoring_sessions 
             WHERE id = ? 
             AND tutor_id = ? 
             AND is_booked = 0`,
            [sessionId, tutorId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Session not found or already booked' 
            });
        }
        
        res.json({ success: true, message: 'Session removed successfully' });
    } catch (error) {
        console.error('Error removing session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

///  NOTE: THIS FUNCTION WILL ALWAYS ERROR
//  it references nonexistent properties of session object 
//  It also seems redundant since already have a dashboard controller  - Jamie

// GET /api/tutor/dashboard
export async function getTutorDashboard(req, res) {

    // NOT VALID PROPERTIES. See login() in authController.js for session initialization
    const tutorId = req.session.tutorId || req.session.userId;
    
    if (!tutorId) {
        return res.status(401).json({ 
            success: false, 
            error: "Please log in as a tutor" 
        });
    }
    
    try {
        // Get tutor name
        const [tutorInfo] = await pool.execute(
            `SELECT DISTINCT tutor_name 
             FROM tutoring_sessions 
             WHERE tutor_id = ? 
             LIMIT 1`,
            [tutorId]
        );
        
        // Get upcoming booked sessions
        const [bookedSessions] = await pool.execute(
            `SELECT * FROM tutoring_sessions 
             WHERE tutor_id = ? 
             AND is_booked = 1
             AND session_date >= CURDATE() 
             ORDER BY session_date, time_slot 
             LIMIT 5`,
            [tutorId]
        );
        
        // Get stats
        const [availableCount] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM tutoring_sessions 
             WHERE tutor_id = ? 
             AND is_booked = 0 
             AND session_date >= CURDATE()`,
            [tutorId]
        );
        
        res.json({
            success: true,
            tutor: tutorInfo[0] || { tutor_name: 'Tutor' },
            bookedSessions,
            stats: {
                availableSlots: availableCount[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getTutorAvailability,
    addTutorAvailability,
    removeTutorAvailability,
    getTutorDashboard
};
