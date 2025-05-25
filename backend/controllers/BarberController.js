const pool = require('../config/database');

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
    const userId = req.user.id; // To jest user_id z tabeli users
    try {
        // Pobierz dane z tabeli users i barbers
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
                SELECT barber_id, ROUND(AVG(rating), 1) AS rating  -- Zaokrąglenie do 1 miejsca po przecinku
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
            // If it's already an array (e.g. from TEXT[] in PG), do nothing
        } else {
            profileData.specialties = [];
        }

        // Konwersja rating i totalReviews na liczby, jeśli są stringami (czasem PG zwraca tak agregacje)
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
        // Jeśli frontend wysyła string oddzielony przecinkami, konwertujemy na tablicę
        specialtiesForDb = specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
        // Jeśli wpisano pusty string lub tylko przecinki, wynikiem będzie pusta tablica []
    } else if (Array.isArray(specialties)) {
        // Jeśli frontend już wysyła tablicę (np. z bardziej zaawansowanego komponentu)
        specialtiesForDb = specialties.filter(s => typeof s === 'string' && s.trim().length > 0);
    } else {
        // Domyślnie pusta tablica, jeśli specialties nie jest stringiem ani tablicą
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

        // Wywołaj getBarberProfile, aby zwrócić pełny, zaktualizowany profil
        // To jest lepsze niż duplikowanie logiki pobierania profilu.
        // Aby to zadziałało, req.user musi być dostępne lub musimy przekazać userId
        // W tym kontekście, mamy userId, więc możemy napisać uproszczoną logikę pobierania
        // lub po prostu przekierować na getBarberProfile. Bezpieczniej jest pobrać ponownie.

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
        }
        else {
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


// --- Funkcje Harmonogramu --- ZMODYFIKOWANE
const getBarberSchedule = async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query; // Oczekujemy daty w formacie YYYY-MM-DD

    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Walidacja formatu daty (prosta)
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

// --- Funkcje Powiadomień ---
const getBarberNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query('SELECT * FROM notifications WHERE barber_id = $1 ORDER BY created_at DESC', [barberId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

const markNotificationAsRead = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND barber_id = $2 RETURNING *',
            [notificationId, barberId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by barber' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE barber_id = $1 AND is_read = FALSE',
            [barberId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
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
        const barberId = barberResult.rows[0].id;
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND barber_id = $2 RETURNING id',
            [notificationId, barberId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notification not found or not owned by barber' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Funkcje Statystyk ---
const getBarberStats = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query; // Należy dodać walidację dat
    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;

        // Upewnij się, że startDate i endDate są dostarczone i poprawne
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
            completedAppointments: completedAppointments.rows[0].count || 0,
            totalRevenue: totalRevenue.rows[0].sum || 0
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Funkcje Wizyt ---
const getBarberAppointments = async (req, res) => {
    const userId = req.user.id;
    const { upcoming } = req.query; // 'true' or 'false'/'undefined'
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
        // Jeśli 'upcoming' nie jest zdefiniowane, pobierz wszystkie

        query += ' ORDER BY a.appointment_time ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const userId = req.user.id;
    const appointmentId = req.params.id;
    const { status } = req.body;

    // Podstawowa walidacja statusu
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled', 'no-show'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid or missing status' });
    }

    try {
        const barberResult = await pool.query('SELECT id FROM barbers WHERE user_id = $1', [userId]);
        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }
        const barberId = barberResult.rows[0].id;

        const result = await pool.query(
            'UPDATE appointments SET status = $1 WHERE id = $2 AND barber_id = $3 RETURNING *',
            [status, appointmentId, barberId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or not owned by barber' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Server error' });
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