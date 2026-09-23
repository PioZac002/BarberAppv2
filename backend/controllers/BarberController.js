const pool = require('../config/database');
const notifications = require('../services/notifications');
const { format } = require('date-fns');
const { pl } = require('date-fns/locale');

// --- Funkcje Portfolio ---
const getBarberPortfolio = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'SELECT * FROM portfolio_images WHERE barber_id = $1 ORDER BY created_at DESC',
            [barberId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania portfolio.' });
    }
};

const addPortfolioImage = async (req, res) => {
    const userId = req.user.id;
    const { image_url, title, description } = req.body;
    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'INSERT INTO portfolio_images (barber_id, image_url, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [barberId, image_url, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas dodawania zdjęcia do portfolio.' });
    }
};

const deletePortfolioImage = async (req, res) => {
    const imageId = req.params.imageId;
    const userId = req.user.id;
    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'DELETE FROM portfolio_images WHERE id = $1 AND barber_id = $2 RETURNING id',
            [imageId, barberId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Zdjęcie nie zostało znalezione.' });
        }
        res.json({ message: 'Zdjęcie zostało usunięte.' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas usuwania zdjęcia.' });
    }
};

const getBarberProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const profileQuery = `
            SELECT 
                u.first_name, 
                u.last_name, 
                u.email AS user_email, 
                u.phone AS user_phone,
                b.id AS barber_table_id,
                b.bio,
                b.address,
                b.working_hours,
                b.instagram,
                b.facebook,
                b.specialties, 
                b.experience,
                b.profile_image_url,
                COALESCE(avg_rating.rating, 0) AS rating,
                COALESCE(review_counts.total_reviews, 0) AS total_reviews
            FROM users u
            JOIN barbers b ON u.id = b.user_id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating), 1) AS rating
                FROM reviews 
                GROUP BY barber_id
            ) AS avg_rating ON b.id = avg_rating.barber_id
            LEFT JOIN (
                SELECT barber_id, COUNT(*) AS total_reviews 
                FROM reviews 
                GROUP BY barber_id
            ) AS review_counts ON b.id = review_counts.barber_id
            WHERE u.id = $1;
        `;
        const result = await pool.query(profileQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil nie został znaleziony.' });
        }

        const profileData = result.rows[0];

        if (profileData.specialties && typeof profileData.specialties === 'string') {
            profileData.specialties = profileData.specialties
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
        } else if (profileData.specialties && Array.isArray(profileData.specialties)) {
            // Already an array
        } else {
            profileData.specialties = [];
        }

        profileData.rating = parseFloat(profileData.rating) || 0;
        profileData.totalReviews = parseInt(profileData.total_reviews, 10) || 0;

        res.json(profileData);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania profilu.' });
    }
};

const updateBarberProfile = async (req, res) => {
    const userId = req.user.id;
    const {
        bio,
        address,
        working_hours,
        instagram,
        facebook,
        specialties,
        experience,
        profile_image_url,
    } = req.body;

    let specialtiesForDb;
    if (typeof specialties === 'string') {
        specialtiesForDb = specialties
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    } else if (Array.isArray(specialties)) {
        specialtiesForDb = specialties.filter(
            s => typeof s === 'string' && s.trim().length > 0
        );
    } else {
        specialtiesForDb = [];
    }

    const normalizedExperience =
        typeof experience === 'string' && experience.trim() !== ''
            ? parseInt(experience.trim(), 10)
            : experience ?? null;

    try {
        const result = await pool.query(
            `UPDATE barbers
             SET bio = $1,
                 address = $2,
                 working_hours = $3,
                 instagram = $4,
                 facebook = $5,
                 specialties = $6,
                 experience = $7,
                 profile_image_url = $8
             WHERE user_id = $9
             RETURNING id`,
            [
                bio,
                address,
                working_hours,
                instagram,
                facebook,
                specialtiesForDb,
                normalizedExperience,
                profile_image_url || null,
                userId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nie znaleziono barbera do aktualizacji.' });
        }

        const updatedProfileQuery = `
            SELECT 
                u.first_name, 
                u.last_name, 
                u.email AS user_email, 
                u.phone AS user_phone,
                b.id AS barber_table_id,
                b.bio,
                b.address,
                b.working_hours,
                b.instagram,
                b.facebook,
                b.specialties,
                b.experience,
                b.profile_image_url,
                COALESCE(avg_rating.rating, 0) AS rating,
                COALESCE(review_counts.total_reviews, 0) AS total_reviews
            FROM users u
            JOIN barbers b ON u.id = b.user_id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating), 1) AS rating 
                FROM reviews 
                GROUP BY barber_id
            ) AS avg_rating ON b.id = avg_rating.barber_id
            LEFT JOIN (
                SELECT barber_id, COUNT(*) AS total_reviews 
                FROM reviews 
                GROUP BY barber_id
            ) AS review_counts ON b.id = review_counts.barber_id
            WHERE u.id = $1;
        `;
        const updatedProfileResult = await pool.query(updatedProfileQuery, [userId]);
        const profileData = updatedProfileResult.rows[0];

        if (profileData.specialties && typeof profileData.specialties === 'string') {
            profileData.specialties = profileData.specialties
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
        } else if (profileData.specialties && Array.isArray(profileData.specialties)) {
            // OK
        } else {
            profileData.specialties = [];
        }
        profileData.rating = parseFloat(profileData.rating) || 0;
        profileData.totalReviews = parseInt(profileData.total_reviews, 10) || 0;

        res.json(profileData);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas aktualizowania profilu.' });
    }
};

const getBarberSchedule = async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Parametr daty jest wymagany.' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res
            .status(400)
            .json({ error: 'Nieprawidłowy format daty. Użyj formatu RRRR-MM-DD.' });
    }

    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;

        const result = await pool.query(
            `SELECT a.id, u.first_name || ' ' || u.last_name AS client_name, u.phone AS client_phone, 
                    s.name AS service_name, s.price, a.appointment_time, a.status
             FROM appointments a
             JOIN users u ON a.client_id = u.id
             JOIN services s ON a.service_id = s.id
             WHERE a.barber_id = $1 AND DATE(a.appointment_time) = $2
             ORDER BY a.appointment_time ASC`,
            [barberId, date]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania grafiku barbera.',
        });
    }
};

const getBarberStats = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;

        if (!startDate || !endDate) {
            return res
                .status(400)
                .json({ error: 'Data początkowa i końcowa są wymagane do statystyk.' });
        }

        const completedAppointments = await pool.query(
            'SELECT COUNT(*) FROM appointments WHERE barber_id = $1 AND status = $2 AND appointment_time BETWEEN $3 AND $4',
            [barberId, 'completed', startDate, endDate]
        );
        const totalRevenue = await pool.query(
            'SELECT SUM(s.price) FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.barber_id = $1 AND a.status = $2 AND a.appointment_time BETWEEN $3 AND $4',
            [barberId, 'completed', startDate, endDate]
        );
        res.json({
            completedAppointments:
                parseInt(completedAppointments.rows[0].count, 10) || 0,
            totalRevenue: parseFloat(totalRevenue.rows[0].sum) || 0,
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania statystyk barbera.',
        });
    }
};

const getBarberAppointments = async (req, res) => {
    const userId = req.user.id;
    const { upcoming } = req.query;
    try {
        const barberResult = await pool.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [userId]
        );
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber nie został znaleziony.' });
        }
        const barberId = barberResult.rows[0].id;

        let query = `
            SELECT a.id, u.first_name || ' ' || u.last_name AS client_name, u.phone AS client_phone, 
                   s.name AS service_name, s.price, a.appointment_time, a.status
            FROM appointments a
            JOIN users u ON a.client_id = u.id
            JOIN services s ON a.service_id = s.id
            WHERE a.barber_id = $1
        `;
        const params = [barberId];

        if (upcoming === 'true') {
            query += ' AND a.appointment_time >= CURRENT_TIMESTAMP';
        } else if (upcoming === 'false') {
            query += ' AND a.appointment_time < CURRENT_TIMESTAMP';
        }
        query += ' ORDER BY a.appointment_time ASC';

        const result = await pool.query(query, params);
        res.json(
            result.rows.map(apt => ({
                ...apt,
                price: parseFloat(apt.price),
            }))
        );
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania wizyt barbera.',
        });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const barberPerformingActionUserId = req.user.id;
    const appointmentId = req.params.id;
    const { status: newStatus } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled', 'no-show'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
            error: 'Nieprawidłowy lub brakujący status wizyty.',
        });
    }

    let pgClient;
    try {
        pgClient = await pool.connect();
        await pgClient.query('BEGIN');

        const barberPerformingActionResult = await pgClient.query(
            'SELECT id, first_name, last_name FROM users WHERE id = $1',
            [barberPerformingActionUserId]
        );
        if (barberPerformingActionResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({
                error: 'Użytkownik barbera wykonującego akcję nie został znaleziony.',
            });
        }
        const barberPerformingAction = barberPerformingActionResult.rows[0];
        const barberPerformingActionName = `${barberPerformingAction.first_name} ${barberPerformingAction.last_name}`;

        const barberTableResult = await pgClient.query(
            'SELECT id FROM barbers WHERE user_id = $1',
            [barberPerformingActionUserId]
        );
        if (barberTableResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({
                error: 'Encja barbera powiązana z tym użytkownikiem nie została znaleziona.',
            });
        }
        const barberTableId = barberTableResult.rows[0].id;

        const updateQuery = `
            UPDATE appointments 
            SET status = $1 
            WHERE id = $2 AND barber_id = $3 
            RETURNING id, client_id, barber_id, service_id, appointment_time, status,
                      (SELECT name FROM services WHERE id = appointments.service_id) AS service_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = appointments.client_id) AS client_name;
        `;
        const result = await pgClient.query(updateQuery, [
            newStatus,
            appointmentId,
            barberTableId,
        ]);

        if (result.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({
                error: 'Wizyta nie została znaleziona lub nie jest przypisana do tego barbera.',
            });
        }

        const updatedAppointment = result.rows[0];
        const appointmentTimeFormatted = format(
            new Date(updatedAppointment.appointment_time),
            "d MMMM yyyy 'o' HH:mm",
            { locale: pl }
        );
        const serviceName = updatedAppointment.service_name;
        const clientName = updatedAppointment.client_name;

        const assignedBarberUserResult = await pgClient.query(
            'SELECT u.first_name, u.last_name FROM users u JOIN barbers b ON u.id = b.user_id WHERE b.id = $1',
            [updatedAppointment.barber_id]
        );
        const assignedBarberName =
            assignedBarberUserResult.rows.length > 0
                ? `${assignedBarberUserResult.rows[0].first_name} ${assignedBarberUserResult.rows[0].last_name}`
                : 'Wybrany barber';

        // Every status the barber can set is news to the client, not just a
        // confirmation: before this, a cancelled or completed visit told
        // nobody. Admins get one row per change, inserted set-wise.
        const CLIENT_NOTICE = {
            confirmed: 'appointment_confirmed',
            completed: 'appointment_completed',
            canceled:  'appointment_canceled',
            cancelled: 'appointment_canceled',
            'no-show': 'appointment_no_show',
        };

        const noticeParams = {
            service: serviceName,
            barber: assignedBarberName,
            client: clientName,
            when: updatedAppointment.appointment_time,
            status: newStatus,
            actor: barberPerformingActionName,
            appointmentId,
        };

        const clientType = CLIENT_NOTICE[newStatus];
        if (clientType) {
            await notifications.notify(pgClient, {
                recipientId: updatedAppointment.client_id,
                audience: 'client',
                type: clientType,
                params: noticeParams,
                link: '/user-dashboard/appointments',
                appointmentId,
            });
        }

        await notifications.notifyAdmins(pgClient, {
            type: 'appointment_status_changed_by_barber',
            params: noticeParams,
            link: `/admin-dashboard/appointments?appointmentId=${appointmentId}`,
            appointmentId,
        });

        await pgClient.query('COMMIT');
        res.json(updatedAppointment);
    } catch (err) {
        if (pgClient) {
            await pgClient.query('ROLLBACK');
        }
        console.error(
            'Error in updateAppointmentStatus (BarberController):',
            err.stack
        );
        res.status(500).json({
            error: 'Błąd serwera podczas aktualizowania statusu wizyty.',
        });
    } finally {
        if (pgClient) {
            pgClient.release();
        }
    }
};

// --- Upload handlers ---
const path = require('path');
const fs = require('fs');

const uploadPortfolioImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku w żądaniu.' });
    }
    // A path, not a URL: the origin belongs to whoever is reading, not to the
    // row. Absolute URLs stored here break permanently when the host changes.
    res.json({ url: `/uploads/portfolio/${req.file.filename}` });
};

const uploadProfilePhoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku w żądaniu.' });
    }
    res.json({ url: `/uploads/profiles/${req.file.filename}` });
};

module.exports = {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    uploadPortfolioImage,
    uploadProfilePhoto,
    getBarberProfile,
    updateBarberProfile,
    getBarberAppointments,
    updateAppointmentStatus,
    getBarberStats,
    getBarberSchedule,
};
