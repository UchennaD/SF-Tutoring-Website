import pool from '../config/db.js';

// Helper function to generate recurring dates
function generateRecurringDates(dayOfWeek, weeksAhead = 4, includeToday = true, timeZone = 'America/Los_Angeles') {
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

    // Compute "today" in the desired timezone as a DATE-ONLY value,
    // then root @ UTC noon to avoid UTC date rollovers (& prevent the 1-day-behind issue)
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const y = Number(parts.find(p => p.type === 'year')?.value);
    const m = Number(parts.find(p => p.type === 'month')?.value);
    const d = Number(parts.find(p => p.type === 'day')?.value);

    const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // UTC noon == same local date in US timezones

    const targetDay = dayMap[dayOfWeek];
    const baseDay = base.getUTCDay();
    let dayUntilTarget = (targetDay - baseDay + 7) % 7;

    // Sessions set for today's day of week get bumped a week if user doesn't wanna start today
    if (dayUntilTarget === 0 && !includeToday) {
        dayUntilTarget = 7;
    }

    for (let week = 0; week < weeksAhead; week++) {
        const date = new Date(base);
        date.setUTCDate(base.getUTCDate() + dayUntilTarget + (week * 7));
        dates.push(date);
    }

    return dates;
}

// GET /api/tutor/availability
export async function getTutorAvailability(req, res) {
    // Get's tutor ID from session instead of availability table
    const tutorId = req.session.user?.id;

    if (!tutorId) {
        return res.status(401).json({ 
            success: false,
            error: 'Please log in as tutor to view availability' });
    }

    try {
            const [sessions] = await pool.execute(
                `SELECT id, session_date, time_slot, start_time, end_time, subjects, mode, description 
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

// Helper function for addTutorAvailability
function subjectsTextToJSON(subjectsText) {
  const arr = String(subjectsText || "")
    .split(",")              // split ONLY on commas (keeps “Computer Science” intact)
    .map(s => s.trim())      // remove leading/trailing whitespace
    .filter(Boolean);        // drop empty entries

  return JSON.stringify(arr.length ? arr : ["General"]);
}

// POST /api/tutor/availability
export async function addTutorAvailability(req, res) {
    const tutorId = req.session.user?.id;
    const tutorName = req.session.user?.fullName;

    if (!tutorId || !tutorName) {
        return res.status(401).json({ 
            success: false, 
            error: 'Please log in as a tutor to add availability'
        });
    }

    if (req.session.user?.role !== 'tutor') {
        return res.status(403).json({
            success: false,
            error: 'Tutor role required to add availability'
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            time_slot: rawTimeSlot,
            is_recurring,
            mode: rawMode,
            day_of_week,
            include_today,
            specific_date
        } = req.body;
        
        // Normalize time_slot to HH:MM:SS for MySQL TIME
        const time_slot = (typeof rawTimeSlot === 'string' && rawTimeSlot.length === 5)
            ? `${rawTimeSlot}:00`
            : rawTimeSlot;

        
        // Frontend should send exact DB enum values: 'Online' | 'In-Person'
        const mode = rawMode || 'Online';
        
        const includeToday = (include_today === undefined || include_today === null) ? true : Boolean(include_today);

        if (!time_slot) {
            await connection.rollback();
            return res.status(422).json({ success: false, error: 'time_slot is required' });
        }

        if (mode !== 'Online' && mode !== 'In-Person') {
            await connection.rollback();
            return res.status(422).json({ success: false, error: "mode must be 'Online' or 'In-Person'" });
        }

        if (is_recurring) {
            if (!day_of_week) {
                await connection.rollback();
                return res.status(422).json({ success: false, error: 'day_of_week is required for recurring availability' });
            }
        } else {
            // Anchor at UTC noon so ISO date string matches the intended calendar date
            sessionDates.push(new Date(`${specific_date}T12:00:00Z`));
        }


        // in addition to frontend input, get existing tutor info from 'tutors' 
        const [tutorData] = await connection.execute(
            `SELECT subjects_offered, rating
            FROM tutors
            WHERE tutor_id = ?
            LIMIT 1`,
            [tutorId]
        )

        // Ensure entry was found
        if (!tutorData || tutorData.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'No tutor entry associated with you. Please register.'
            });
        }
        // Destructure row to get tutorInfo
        const tutorInfo = tutorData[0];
        

        // tutors.subjects_offered could be plaintext, CSV or JSON; 
        // while tutoring_sessions.subjects is JSON NOT NULL
        const subjects = subjectsTextToJSON(tutorInfo.subjects_offered);
        
        // tutors table column is `rating` (decimal(3,2)); tutoring_sessions expects decimal(2,1)
        const rating = Math.round((Number(tutorInfo.rating) || 0) * 10) / 10;

        const sessionDates = [];
        
        // Fill sessionDates with the series of dates (if recurring) or individual date (if not)
        if (is_recurring) {
            const dates = generateRecurringDates(day_of_week, 4, includeToday); // generate a month out
            sessionDates.push(...dates);
        } else {
            // Anchor at UTC noon so ISO date string matches the intended calendar date
            sessionDates.push(new Date(`${specific_date}T12:00:00Z`));
        }
        
        let insertedCount = 0;
        let skippedCount = 0;
        
        for (const date of sessionDates) {
            const sessionDate = date.toISOString().slice(0, 10);
            
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
                tutor_rating, description, is_booked, tutor_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
                [
                    tutorName,
                    subjects,
                    mode,
                    sessionDate,
                    time_slot,
                    rating,
                    'Available for tutoring',
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
    const tutorId = req.session.user?.id;
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


//  It seems redundant since already have a dashboard controller  - Jamie

// GET /api/tutor/dashboard
export async function getTutorDashboard(req, res) {

    const tutorId = req.session.user?.id;
    
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
