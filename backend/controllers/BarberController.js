const pool = require('../config/database');
const { format } = require('date-fns'); // Dodajemy import format z date-fns

// --- Funkcje Portfolio ---
const getBarberPortfolio = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query('SELECT * FROM portfolio_images WHERE barber_id = $1 ORDER BY created_at DESC', [barberId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

const addPortfolioImage = async (req, res) => {
    const userId = req.user.id;
    const { image_url, title, description } = req.body;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'INSERT INTO portfolio_images (barber_id, image_url, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [barberId, image_url, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

const deletePortfolioImage = async (req, res) => {
    const imageId = req.params.imageId;
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query('DELETE FROM portfolio_images WHERE id = $1 AND barber_id = $2 RETURNING id', [imageId, barberId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json({ message: 'Image deleted' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
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
            return res.status(404).json({ error: 'Profile not found' });
        }

        const profileData = result.rows[0];

        if (profileData.specialties && typeof profileData.specialties === 'string') {
            profileData.specialties = profileData.specialties.split(',').map(s => s.trim()).filter(s => s);
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
        res.status(500).json({ error: 'Server error getting profile' });
    }
};

const updateBarberProfile = async (req, res) => {
    const userId = req.user.id;
    const { bio, address, working_hours, instagram, facebook, specialties, experience } = req.body;
    let specialtiesForDb;
    if (typeof specialties === 'string') {
        specialtiesForDb = specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else if (Array.isArray(specialties)) {
        specialtiesForDb = specialties.filter(s => typeof s === 'string' && s.trim().length > 0);
    } else {
        specialtiesForDb = [];
    }

    try {
        const result = await pool.query(
            `UPDATE barbers
             SET bio = $1, address = $2, working_hours = $3, instagram = $4, facebook = $5, specialties = $6, experience = $7
             WHERE user_id = $8 RETURNING id`,
            [bio, address, working_hours, instagram, facebook, specialtiesForDb, experience, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found to update' });
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
            profileData.specialties = profileData.specialties.split(',').map(s => s.trim()).filter(s => s);
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
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

const getBarberSchedule = async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
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
        res.status(500).json({ error: 'Server error fetching schedule' });
    }
};

const getBarberNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        // Zakładamy, że powiadomienia dla barbera są w tabeli 'notifications' i łączone przez 'barber_id'
        // Jeśli barber jest identyfikowany przez 'recipient_user_id', zapytanie musiałoby wyglądać inaczej
        const result = await pool.query('SELECT * FROM notifications WHERE barber_id = $1 ORDER BY created_at DESC', [barberId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error fetching barber notifications' });
    }
};

const markNotificationAsRead = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id; // user_id barbera
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberTableId = barberResult.rows[0].id; // id z tabeli barbers

        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND barber_id = $2 RETURNING *',
            [notificationId, barberTableId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by this barber' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberTableId = barberResult.rows[0].id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE barber_id = $1 AND is_read = FALSE',
            [barberTableId]
        );
        res.json({ message: 'All barber notifications marked as read' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error marking all notifications as read' });
    }
};

const deleteNotification = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberTableId = barberResult.rows[0].id;
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND barber_id = $2 RETURNING id',
            [notificationId, barberTableId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by this barber' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
};


const getBarberStats = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required for stats.' });
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
            completedAppointments: parseInt(completedAppointments.rows[0].count, 10) || 0,
            totalRevenue: parseFloat(totalRevenue.rows[0].sum) || 0
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error fetching barber stats' });
    }
};


const getBarberAppointments = async (req, res) => {
    const userId = req.user.id;
    const { upcoming } = req.query;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
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
        res.json(result.rows.map(apt => ({...apt, price: parseFloat(apt.price)})));
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error fetching barber appointments' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const barberPerformingActionUserId = req.user.id; // user_id barbera, który dokonuje zmiany
    const appointmentId = req.params.id;
    const { status: newStatus } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled', 'no-show'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ error: 'Invalid or missing status' });
    }

    let pgClient;
    try {
        pgClient = await pool.connect();
        await pgClient.query('BEGIN');

        const barberPerformingActionResult = await pgClient.query('SELECT id, first_name, last_name FROM users WHERE id = $1', [barberPerformingActionUserId]);
        if (barberPerformingActionResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({ error: 'Barber performing action (user) not found.' });
        }
        const barberPerformingAction = barberPerformingActionResult.rows[0];
        const barberPerformingActionName = `${barberPerformingAction.first_name} ${barberPerformingAction.last_name}`;

        // Pobierz ID barbera z tabeli barbers na podstawie user_id
        const barberTableResult = await pgClient.query('SELECT id FROM barbers WHERE user_id = $1', [barberPerformingActionUserId]);
        if (barberTableResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({ error: 'Barber (entity) not found for the user performing action.' });
        }
        const barberTableId = barberTableResult.rows[0].id; // ID barbera z tabeli 'barbers'

        // Zaktualizuj status wizyty i pobierz potrzebne dane do powiadomień
        const updateQuery = `
            UPDATE appointments 
            SET status = $1 
            WHERE id = $2 AND barber_id = $3 
            RETURNING id, client_id, barber_id, service_id, appointment_time, status,
                      (SELECT name FROM services WHERE id = appointments.service_id) AS service_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = appointments.client_id) AS client_name;
        `;
        const result = await pgClient.query(updateQuery, [newStatus, appointmentId, barberTableId,]);

        if (result.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found or not assigned to this barber.' });
        }

        const updatedAppointment = result.rows[0];
        const appointmentTimeFormatted = format(new Date(updatedAppointment.appointment_time), "MMM d, yyyy 'at' h:mm a");
        const serviceName = updatedAppointment.service_name;
        const clientName = updatedAppointment.client_name;
        // Nazwa barbera przypisanego do wizyty (może być inna niż potwierdzający, jeśli admin by to robił)
        const assignedBarberUserResult = await pgClient.query(
            'SELECT u.first_name, u.last_name FROM users u JOIN barbers b ON u.id = b.user_id WHERE b.id = $1',
            [updatedAppointment.barber_id]
        );
        const assignedBarberName = assignedBarberUserResult.rows.length > 0 ? `${assignedBarberUserResult.rows[0].first_name} ${assignedBarberUserResult.rows[0].last_name}` : 'Selected Barber';


        if (newStatus === 'confirmed') {
            // 1. Powiadomienie dla klienta
            const clientNotificationTitle = "Appointment Confirmed!";
            const clientMessage = `Your appointment for ${serviceName} with ${assignedBarberName} on ${appointmentTimeFormatted} has been confirmed.`;
            await pgClient.query(
                `INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
                [updatedAppointment.client_id, 'appointment_confirmed', clientNotificationTitle, clientMessage, `/user-dashboard/appointments`]
            );

            // 2. Powiadomienie dla administratorów
            const adminNotificationTitle = "Appointment Status Updated by Barber";
            const adminMessage = `Appointment ID ${appointmentId} (Client: ${clientName}, Barber: ${assignedBarberName}, Service: ${serviceName}) status changed to ${newStatus.toUpperCase()} by barber ${barberPerformingActionName}.`;
            const adminLink = `/admin-dashboard/appointments?appointmentId=${appointmentId}`;
            const adminUsersResult = await pgClient.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of adminUsersResult.rows) {
                await pgClient.query(
                    `INSERT INTO admin_notifications (admin_user_id, type, title, message, link, related_appointment_id, related_client_id, related_barber_id, is_read, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())`,
                    [
                        admin.id,
                        'appointment_status_changed_by_barber',
                        adminNotificationTitle,
                        adminMessage,
                        adminLink,
                        appointmentId,
                        updatedAppointment.client_id,
                        updatedAppointment.barber_id // ID barbera z tabeli appointments (FK do barbers.id)
                    ]
                );
            }
        }
        // Można dodać logikę powiadomień dla innych statusów (np. 'canceled', 'completed')

        await pgClient.query('COMMIT');
        res.json(updatedAppointment);

    } catch (err) {
        if (pgClient) {
            await pgClient.query('ROLLBACK');
        }
        console.error("Error in updateAppointmentStatus (BarberController):", err.stack);
        res.status(500).json({ error: 'Server error updating appointment status' });
    } finally {
        if (pgClient) {
            pgClient.release();
        }
    }
};

module.exports = {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    getBarberProfile,
    updateBarberProfile,
    getBarberNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    getBarberAppointments,
    updateAppointmentStatus,
    getBarberStats,
    getBarberSchedule
};