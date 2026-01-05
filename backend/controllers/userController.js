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
                a.appointment_time, 
                a.status
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users barber_user ON b.user_id = barber_user.id
            WHERE a.client_id = $1
        `;
        const queryParams = [clientId];

        if (
            statusFilter &&
            ['pending', 'confirmed', 'completed', 'canceled', 'cancelled', 'no-show'].includes(
                statusFilter.toLowerCase()
            )
        ) {
            const dbStatus =
                statusFilter.toLowerCase() === 'cancelled'
                    ? 'canceled'
                    : statusFilter.toLowerCase();
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
            time: new Date(apt.appointment_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }),
            status: apt.status,
            duration: `${apt.service_duration} min`,
            price: `${parseFloat(apt.service_price).toFixed(2)} PLN`,
            appointment_timestamp: apt.appointment_time,
        }));

        res.json(appointments);
    } catch (err) {
        console.error('Error in getUserAppointments:', err.stack);
        res
            .status(500)
            .json({ error: 'Błąd serwera podczas pobierania wizyt użytkownika.' });
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
            return res.status(404).json({
                error:
                    'Wizyta nie została znaleziona lub nie masz uprawnień, aby ją anulować.',
            });
        }

        const appointment = appointmentResult.rows[0];
        if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
            return res.status(400).json({
                error: `Nie można anulować wizyty ze statusem: ${appointment.status}`,
            });
        }
        // Można dodać logikę, np. anulowanie możliwe tylko X godzin przed wizytą

        const result = await pool.query(
            "UPDATE appointments SET status = 'canceled' WHERE id = $1 RETURNING *",
            [appointmentId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in cancelUserAppointment:', err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas anulowania wizyty.' });
    }
};

exports.getNextUpcomingAppointment = async (req, res) => {
    const clientId = req.user.id;
    try {
        const result = await pool.query(
            `
            SELECT 
                a.id, 
                s.name AS service_name, 
                (barber_user.first_name || ' ' || barber_user.last_name) AS barber_name,
                a.appointment_time
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users barber_user ON b.user_id = barber_user.id
            WHERE a.client_id = $1 
              AND a.status IN ('pending', 'confirmed') 
              AND a.appointment_time >= CURRENT_TIMESTAMP
            ORDER BY a.appointment_time ASC
            LIMIT 1;
        `,
            [clientId]
        );

        if (result.rows.length > 0) {
            const apt = result.rows[0];
            res.json({
                id: apt.id,
                date: new Date(apt.appointment_time).toISOString().split('T')[0],
                time: new Date(apt.appointment_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }),
                service: apt.service_name,
                barber: apt.barber_name,
            });
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error('Error in getNextUpcomingAppointment:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania najbliższej nadchodzącej wizyty.',
        });
    }
};

// --- Kontrolery Powiadomień Klienta ---
exports.getUserNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT id, type, title, message, link, is_read, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in getUserNotifications:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania powiadomień użytkownika.',
        });
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
            return res.status(404).json({
                error:
                    'Powiadomienie nie zostało znalezione lub nie należy do tego użytkownika.',
            });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in markUserNotificationAsRead:', err.stack);
        res.status(500).json({
            error:
                'Błąd serwera podczas oznaczania powiadomienia jako przeczytane.',
        });
    }
};

exports.markAllUserNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query(
            'UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.json({
            message:
                'Wszystkie powiadomienia użytkownika zostały oznaczone jako przeczytane.',
        });
    } catch (err) {
        console.error('Error in markAllUserNotificationsAsRead:', err.stack);
        res.status(500).json({
            error:
                'Błąd serwera podczas oznaczania wszystkich powiadomień jako przeczytane.',
        });
    }
};

exports.deleteUserNotification = async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM user_notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [notificationId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error:
                    'Powiadomienie nie zostało znalezione lub nie należy do tego użytkownika.',
            });
        }
        res.json({ message: 'Powiadomienie użytkownika zostało usunięte.' });
    } catch (err) {
        console.error('Error in deleteUserNotification:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas usuwania powiadomienia użytkownika.',
        });
    }
};

// --- Kontrolery Profilu Klienta ---
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: 'Profil użytkownika nie został znaleziony.' });
        }
        const profile = result.rows[0];
        res.json({
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
            phone: profile.phone,
        });
    } catch (err) {
        console.error('Error in getUserProfile:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania profilu użytkownika.',
        });
    }
};

exports.updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({
            error: 'Imię, nazwisko i adres e‑mail są wymagane.',
        });
    }

    try {
        // Sprawdzenie unikalności emaila, jeśli jest zmieniany
        if (email) {
            const currentUser = await pool.query(
                'SELECT email FROM users WHERE id = $1',
                [userId]
            );
            if (currentUser.rows.length > 0 && currentUser.rows[0].email !== email) {
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE email = $1 AND id != $2',
                    [email, userId]
                );
                if (existingUser.rows.length > 0) {
                    return res.status(400).json({
                        error: 'Adres e‑mail jest już używany przez inne konto.',
                    });
                }
            }
        }

        const result = await pool.query(
            `
            UPDATE users 
            SET first_name = $1, last_name = $2, email = $3, phone = $4
            WHERE id = $5 
            RETURNING id, first_name, last_name, email, phone
        `,
            [firstName, lastName, email, phone, userId]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: 'Nie znaleziono użytkownika do aktualizacji.' });
        }
        const updatedProfile = result.rows[0];
        res.json({
            firstName: updatedProfile.first_name,
            lastName: updatedProfile.last_name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
        });
    } catch (err) {
        console.error('Error in updateUserProfile:', err.stack);
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res
                .status(400)
                .json({ error: 'Adres e‑mail już istnieje w systemie.' });
        }
        res.status(500).json({
            error: 'Błąd serwera podczas aktualizowania profilu użytkownika.',
        });
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
                a.appointment_time
            FROM reviews r
            JOIN appointments a ON r.appointment_id = a.id
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users b_user ON b.user_id = b_user.id
            WHERE r.client_id = $1
            ORDER BY r.created_at DESC;
        `;
        const result = await pool.query(query, [clientId]);

        const reviews = result.rows.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            date: new Date(review.date).toISOString().split('T')[0],
            service: review.service_name,
            barber: review.barber_name,
            appointmentDate: new Date(
                review.appointment_time
            ).toLocaleDateString(),
        }));
        res.json(reviews);
    } catch (err) {
        console.error('Error in getUserReviewsWritten:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania recenzji użytkownika.',
        });
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
        res.json(
            result.rows.map(apt => ({
                appointment_id: apt.appointment_id,
                service_name: apt.service_name,
                barber_name: apt.barber_name,
                display_text: `${apt.service_name} u ${apt.barber_name} dnia ${new Date(
                    apt.appointment_time
                ).toLocaleDateString()}`,
            }))
        );
    } catch (err) {
        console.error('Error in getCompletedUnreviewedAppointments:', err.stack);
        res.status(500).json({
            error:
                'Błąd serwera podczas pobierania wizyt oczekujących na recenzję.',
        });
    }
};

// Dodaje nową recenzję
exports.submitReview = async (req, res) => {
    const clientId = req.user.id;
    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id || rating === undefined || !comment) {
        return res.status(400).json({
            error: 'Identyfikator wizyty, ocena i komentarz są wymagane.',
        });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res
            .status(400)
            .json({ error: 'Ocena musi być liczbą od 1 do 5.' });
    }

    try {
        const appointmentCheck = await pool.query(
            'SELECT id, client_id, barber_id, service_id, status FROM appointments WHERE id = $1 AND client_id = $2',
            [appointment_id, clientId]
        );

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({
                error:
                    'Wizyta nie została znaleziona lub nie należy do zalogowanego użytkownika.',
            });
        }
        const appointment = appointmentCheck.rows[0];
        if (appointment.status !== 'completed') {
            return res.status(400).json({
                error: 'Możesz ocenić tylko zakończone wizyty.',
            });
        }

        const existingReview = await pool.query(
            'SELECT id FROM reviews WHERE appointment_id = $1 AND client_id = $2',
            [appointment_id, clientId]
        );
        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                error: 'Ta wizyta została już przez Ciebie oceniona.',
            });
        }

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
            comment,
        ]);

        const serviceResult = await pool.query(
            'SELECT name FROM services WHERE id = $1',
            [appointment.service_id]
        );
        const barberUserResult = await pool.query(
            `
            SELECT (u.first_name || ' ' || u.last_name) AS name 
            FROM users u 
            JOIN barbers b ON u.id = b.user_id 
            WHERE b.id = $1
        `,
            [appointment.barber_id]
        );

        const createdReview = newReviewResult.rows[0];
        res.status(201).json({
            id: createdReview.id,
            rating: createdReview.rating,
            comment: createdReview.comment,
            date: new Date(createdReview.created_at).toISOString().split('T')[0],
            service:
                serviceResult.rows.length > 0
                    ? serviceResult.rows[0].name
                    : 'Nieznana usługa',
            barber:
                barberUserResult.rows.length > 0
                    ? barberUserResult.rows[0].name
                    : 'Nieznany barber',
        });
    } catch (err) {
        console.error('Error in submitReview:', err.stack);
        if (err.code === '23505') {
            return res.status(400).json({
                error:
                    'Recenzja dla tej wizyty prawdopodobnie już istnieje lub naruszono inne ograniczenie.',
            });
        }
        res.status(500).json({
            error: 'Błąd serwera podczas dodawania recenzji.',
        });
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
        const totalAppointments =
            parseInt(appointmentsCountResult.rows[0].total_appointments, 10) || 0;

        const reviewsResult = await pool.query(
            'SELECT ROUND(AVG(rating), 1) as avg_rating_given FROM reviews WHERE client_id = $1',
            [clientId]
        );
        const avgRatingGiven = reviewsResult.rows[0].avg_rating_given
            ? parseFloat(reviewsResult.rows[0].avg_rating_given)
            : null;

        res.json({
            totalAppointments,
            hoursSaved: 'brak danych',
            avgRatingGiven: avgRatingGiven,
        });
    } catch (err) {
        console.error('Error in getUserStats:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania statystyk użytkownika.',
        });
    }
};
