const pool = require('../config/database');

// --- Kontrolery Wizyt Klienta ---
exports.getUserAppointments = async (req, res) => {
    const clientId = req.user.id;
    const { status: statusFilter } = req.query;

    try {
        let query = `
            SELECT 
                a.id, 
                s.name AS service_name, 
                s.duration AS service_duration,
                s.price AS service_price,
                (barber_user.first_name || ' ' || barber_user.last_name) AS barber_name,
                -- Usunięto b.address AS location
                a.appointment_time, 
                a.status
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users barber_user ON b.user_id = barber_user.id
            WHERE a.client_id = $1
        `;
        const queryParams = [clientId];

        if (statusFilter && ['pending', 'confirmed', 'completed', 'canceled', 'cancelled', 'no-show'].includes(statusFilter.toLowerCase())) {
            const dbStatus = statusFilter.toLowerCase() === 'cancelled' ? 'canceled' : statusFilter.toLowerCase();
            query += ` AND a.status = $${queryParams.length + 1}`;
            queryParams.push(dbStatus);
        }

        query += ' ORDER BY a.appointment_time DESC';

        const result = await pool.query(query, queryParams);

        const appointments = result.rows.map(apt => ({
            id: apt.id,
            service: apt.service_name,
            barber: apt.barber_name,
            date: new Date(apt.appointment_time).toISOString().split('T')[0],
            time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            status: apt.status,
            duration: `${apt.service_duration} min`,
            price: `$${parseFloat(apt.service_price).toFixed(2)}`,
            // location: apt.location, // Usunięto
            appointment_timestamp: apt.appointment_time
        }));

        res.json(appointments);
    } catch (err) {
        console.error("Error in getUserAppointments:", err.stack);
        res.status(500).json({ error: 'Server error fetching user appointments' });
    }
};

exports.cancelUserAppointment = async (req, res) => {
    const clientId = req.user.id;
    const { appointmentId } = req.params;

    try {
        const appointmentResult = await pool.query(
            'SELECT * FROM appointments WHERE id = $1 AND client_id = $2',
            [appointmentId, clientId]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or you do not have permission to cancel it.' });
        }

        const appointment = appointmentResult.rows[0];
        if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
            return res.status(400).json({ error: `Cannot cancel appointment with status: ${appointment.status}` });
        }
        // Można dodać logikę, np. anulowanie możliwe tylko X godzin przed wizytą

        const result = await pool.query(
            "UPDATE appointments SET status = 'canceled' WHERE id = $1 RETURNING *",
            [appointmentId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in cancelUserAppointment:", err.stack);
        res.status(500).json({ error: 'Server error canceling appointment' });
    }
};

exports.getNextUpcomingAppointment = async (req, res) => {
    const clientId = req.user.id;
    try {
        const result = await pool.query(`
            SELECT 
                a.id, 
                s.name AS service_name, 
                (barber_user.first_name || ' ' || barber_user.last_name) AS barber_name,
                a.appointment_time
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users barber_user ON b.user_id = barber_user.id
            WHERE a.client_id = $1 AND a.status IN ('pending', 'confirmed') AND a.appointment_time >= CURRENT_TIMESTAMP
            ORDER BY a.appointment_time ASC
            LIMIT 1;
        `, [clientId]);

        if (result.rows.length > 0) {
            const apt = result.rows[0];
            res.json({
                id: apt.id,
                date: new Date(apt.appointment_time).toISOString().split('T')[0],
                time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                service: apt.service_name,
                barber: apt.barber_name,
            });
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error("Error in getNextUpcomingAppointment:", err.stack);
        res.status(500).json({ error: 'Server error fetching next upcoming appointment' });
    }
};


// --- Kontrolery Powiadomień Klienta ---
exports.getUserNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT id, type, title, message, link, is_read, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getUserNotifications:", err.stack);
        res.status(500).json({ error: 'Server error fetching user notifications' });
    }
};

exports.markUserNotificationAsRead = async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    try {
        const result = await pool.query(
            'UPDATE user_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [notificationId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by user' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in markUserNotificationAsRead:", err.stack);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
};

exports.markAllUserNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query('UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [userId]);
        res.json({ message: 'All user notifications marked as read' });
    } catch (err) {
        console.error("Error in markAllUserNotificationsAsRead:", err.stack);
        res.status(500).json({ error: 'Server error marking all notifications as read' });
    }
};

exports.deleteUserNotification = async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    try {
        const result = await pool.query('DELETE FROM user_notifications WHERE id = $1 AND user_id = $2 RETURNING id', [notificationId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by user' });
        }
        res.json({ message: 'User notification deleted' });
    } catch (err) {
        console.error("Error in deleteUserNotification:", err.stack);
        res.status(500).json({ error: 'Server error deleting user notification' });
    }
};

// --- Kontrolery Profilu Klienta ---
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        // Pobieramy tylko te pola, które są w tabeli users
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const profile = result.rows[0];
        res.json({
            // Mapowanie do nazw używanych w frontendzie, jeśli są inne
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            // address i dateOfBirth usunięte
        });
    } catch (err) {
        console.error("Error in getUserProfile:", err.stack);
        res.status(500).json({ error: 'Server error fetching user profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    // Z request body bierzemy tylko te pola, które użytkownik może edytować i są w tabeli users
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
    }
    // Można dodać walidację formatu email, phone

    try {
        // Sprawdzenie unikalności emaila, jeśli jest zmieniany
        if (email) {
            const currentUser = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
            if (currentUser.rows.length > 0 && currentUser.rows[0].email !== email) {
                const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
                if (existingUser.rows.length > 0) {
                    return res.status(400).json({ error: 'Email already in use by another account.' });
                }
            }
        }

        const result = await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, email = $3, phone = $4
             WHERE id = $5 RETURNING id, first_name, last_name, email, phone`, // Zwracamy zaktualizowane pola
            [firstName, lastName, email, phone, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found for update' });
        }
        const updatedProfile = result.rows[0];
        res.json({
            firstName: updatedProfile.first_name,
            lastName: updatedProfile.last_name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
        });
    } catch (err) {
        console.error("Error in updateUserProfile:", err.stack);
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        res.status(500).json({ error: 'Server error updating user profile' });
    }
};

// Pobiera wszystkie recenzje napisane przez zalogowanego użytkownika
exports.getUserReviewsWritten = async (req, res) => {
    const clientId = req.user.id;
    try {
        const query = `
            SELECT 
                r.id, 
                r.rating, 
                r.comment, 
                r.created_at AS date, 
                s.name AS service_name,
                (b_user.first_name || ' ' || b_user.last_name) AS barber_name,
                a.appointment_time -- Dodatkowe info o dacie wizyty
            FROM reviews r
            JOIN appointments a ON r.appointment_id = a.id
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users b_user ON b.user_id = b_user.id
            WHERE r.client_id = $1
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [clientId]);

        // Mapowanie do formatu oczekiwanego przez frontend (jeśli konieczne)
        const reviews = result.rows.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            date: new Date(review.date).toISOString().split('T')[0], // Data wystawienia recenzji
            service: review.service_name,
            barber: review.barber_name,
            appointmentDate: new Date(review.appointment_time).toLocaleDateString(), // Data samej wizyty
            // helpful: 0, // Placeholder, jeśli frontend tego oczekuje
            // canEdit: false, // Placeholder
        }));
        res.json(reviews);
    } catch (err) {
        console.error("Error in getUserReviewsWritten:", err.stack);
        res.status(500).json({ error: 'Server error fetching user reviews' });
    }
};

// Pobiera zakończone wizyty użytkownika, które nie zostały jeszcze ocenione
exports.getCompletedUnreviewedAppointments = async (req, res) => {
    const clientId = req.user.id;
    try {
        const query = `
            SELECT 
                a.id AS appointment_id,
                s.name AS service_name,
                (b_user.first_name || ' ' || b_user.last_name) AS barber_name,
                a.appointment_time
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users b_user ON b.user_id = b_user.id
            WHERE a.client_id = $1 
              AND a.status = 'completed'
              AND NOT EXISTS (
                  SELECT 1 FROM reviews r WHERE r.appointment_id = a.id AND r.client_id = $1
              )
            ORDER BY a.appointment_time DESC;
        `;
        const result = await pool.query(query, [clientId]);
        res.json(result.rows.map(apt => ({
            appointment_id: apt.appointment_id,
            service_name: apt.service_name,
            barber_name: apt.barber_name,
            // Formatowanie daty wizyty dla czytelności w dropdownie
            display_text: `${apt.service_name} with ${apt.barber_name} on ${new Date(apt.appointment_time).toLocaleDateString()}`
        })));
    } catch (err) {
        console.error("Error in getCompletedUnreviewedAppointments:", err.stack);
        res.status(500).json({ error: 'Server error fetching appointments to review' });
    }
};

// Dodaje nową recenzję
exports.submitReview = async (req, res) => {
    const clientId = req.user.id;
    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id || rating === undefined || !comment) {
        return res.status(400).json({ error: 'Appointment ID, rating, and comment are required.' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    try {
        // Krok 1: Sprawdź, czy wizyta istnieje, należy do klienta i jest 'completed'
        const appointmentCheck = await pool.query(
            'SELECT id, client_id, barber_id, service_id, status FROM appointments WHERE id = $1 AND client_id = $2',
            [appointment_id, clientId]
        );

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or does not belong to you.' });
        }
        const appointment = appointmentCheck.rows[0];
        if (appointment.status !== 'completed') {
            return res.status(400).json({ error: 'You can only review completed appointments.' });
        }

        // Krok 2: Sprawdź, czy recenzja dla tej wizyty już nie istnieje
        const existingReview = await pool.query(
            'SELECT id FROM reviews WHERE appointment_id = $1 AND client_id = $2',
            [appointment_id, clientId]
        );
        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this appointment.' });
        }

        // Krok 3: Dodaj recenzję
        const insertQuery = `
            INSERT INTO reviews (appointment_id, client_id, barber_id, service_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, rating, comment, created_at;
        `;
        const newReviewResult = await pool.query(insertQuery, [
            appointment_id,
            clientId,
            appointment.barber_id,
            appointment.service_id,
            rating,
            comment
        ]);

        // Pobierz dodatkowe dane do zwrócenia (nazwa usługi, barbera)
        const serviceResult = await pool.query('SELECT name FROM services WHERE id = $1', [appointment.service_id]);
        const barberUserResult = await pool.query(`
            SELECT (u.first_name || ' ' || u.last_name) AS name 
            FROM users u JOIN barbers b ON u.id = b.user_id 
            WHERE b.id = $1
        `, [appointment.barber_id]);

        const createdReview = newReviewResult.rows[0];
        res.status(201).json({
            id: createdReview.id,
            rating: createdReview.rating,
            comment: createdReview.comment,
            date: new Date(createdReview.created_at).toISOString().split('T')[0],
            service: serviceResult.rows.length > 0 ? serviceResult.rows[0].name : 'Unknown Service',
            barber: barberUserResult.rows.length > 0 ? barberUserResult.rows[0].name : 'Unknown Barber',
        });

    } catch (err) {
        console.error("Error in submitReview:", err.stack);
        // Sprawdzenie, czy błąd nie jest spowodowany np. naruszeniem unikalnego klucza (jeśli taki by istniał)
        if (err.code === '23505') { // PostgreSQL unique violation
            return res.status(400).json({ error: 'A review for this appointment might already exist or another constraint was violated.' });
        }
        res.status(500).json({ error: 'Server error submitting review' });
    }
};

// --- Kontrolery Statystyk Klienta (dla UserOverview) ---
exports.getUserStats = async (req, res) => {
    const clientId = req.user.id;
    try {
        const appointmentsCountResult = await pool.query(
            "SELECT COUNT(*) AS total_appointments FROM appointments WHERE client_id = $1 AND status NOT IN ('canceled', 'cancelled')",
            [clientId]
        );
        const totalAppointments = parseInt(appointmentsCountResult.rows[0].total_appointments, 10) || 0;

        const reviewsResult = await pool.query(
            "SELECT ROUND(AVG(rating), 1) as avg_rating_given FROM reviews WHERE client_id = $1",
            [clientId]
        );
        // AVG może zwrócić null, jeśli nie ma recenzji, co parseFloat zamieni na NaN.
        const avgRatingGiven = reviewsResult.rows[0].avg_rating_given ? parseFloat(reviewsResult.rows[0].avg_rating_given) : null;


        res.json({
            totalAppointments,
            hoursSaved: "N/A",
            avgRatingGiven: avgRatingGiven,
        });
    } catch (err) {
        console.error("Error in getUserStats:", err.stack);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
};