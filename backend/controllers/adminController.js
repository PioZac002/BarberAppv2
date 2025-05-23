const pool = require('../config/database');

const getStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM appointments WHERE status = 'active') AS activeAppointments,
                (SELECT COUNT(*) FROM services) AS services,
                (SELECT SUM(price) FROM appointments JOIN services ON appointments.service_id = services.id WHERE appointments.status = 'completed') AS revenue
        `);
        const stats = result.rows[0];
        res.json(stats);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const getRevenue = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(MONTH FROM appointment_time) AS month,
                SUM(price) AS amount
            FROM appointments
            JOIN services ON appointments.service_id = services.id
            WHERE appointments.status = 'completed'
            GROUP BY EXTRACT(MONTH FROM appointment_time)
        `);
        const revenueData = result.rows.map(row => ({
            month: new Date(0, row.month - 1).toLocaleString('default', { month: 'short' }),
            amount: parseFloat(row.amount)
        }));
        res.json(revenueData);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const getRecentActivities = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 'user' AS type, 'New user registered' AS description, created_at AS timestamp
            FROM users
            UNION
            SELECT 'appointment' AS type, 'New appointment booked' AS description, appointment_time AS timestamp
            FROM appointments
            UNION
            SELECT 'review' AS type, 'New review submitted' AS description, created_at AS timestamp
            FROM reviews
            ORDER BY timestamp DESC
            LIMIT 10
        `);
        const activities = result.rows.map((row, index) => ({
            id: index + 1,
            type: row.type,
            description: row.description,
            timestamp: row.timestamp
        }));
        res.json(activities);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Endpoint dla zakładki "Users"
const getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        const users = result.rows;
        res.json(users);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Aktualizacja użytkownika
const updateUser = async (req, res) => {
    const { first_name, last_name, email, phone, role } = req.body;
    const userId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, role = $5 WHERE id = $6 RETURNING *',
            [first_name, last_name, email, phone, role, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const client = await pool.connect();

    try {
        console.log(`Attempting to delete user ID: ${userId}`);
        await client.query('BEGIN');

        // Krok 1: Usunięcie powiązanych rekordów z tabeli reviews
        // Najpierw znajdujemy appointments powiązane z użytkownikiem (jako client_id lub barber_id)
        const appointmentsResult = await client.query(
            'SELECT id FROM appointments WHERE client_id = $1 OR barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        const appointmentIds = appointmentsResult.rows.map(row => row.id);

        if (appointmentIds.length > 0) {
            // Usuwamy rekordy z reviews powiązane z tymi appointments
            const deleteReviewsResult = await client.query(
                'DELETE FROM reviews WHERE appointment_id = ANY($1::int[])',
                [appointmentIds]
            );
            console.log(`Deleted ${deleteReviewsResult.rowCount} reviews for user ID ${userId}`);
        }

        // Krok 2: Usunięcie powiązanych rekordów z tabeli appointments (dla client_id)
        const deleteAppointmentsResult = await client.query(
            'DELETE FROM appointments WHERE client_id = $1',
            [userId]
        );
        console.log(`Deleted ${deleteAppointmentsResult.rowCount} appointments for user ID ${userId} (as client)`);

        // Krok 3: Usunięcie powiązanych rekordów z tabeli appointments (dla barber_id)
        const deleteAppointmentsBarberResult = await client.query(
            'DELETE FROM appointments WHERE barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        console.log(`Deleted ${deleteAppointmentsBarberResult.rowCount} appointments for user ID ${userId} (as barber)`);

        // Krok 4: Usunięcie powiązanych rekordów z tabeli barbers (dla user_id)
        const deleteBarbersResult = await client.query(
            'DELETE FROM barbers WHERE user_id = $1',
            [userId]
        );
        console.log(`Deleted ${deleteBarbersResult.rowCount} barbers for user ID ${userId}`);

        // Krok 5: Usunięcie użytkownika z tabeli users
        const deleteUserResult = await client.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [userId]
        );

        if (deleteUserResult.rowCount === 0) {
            console.log(`User ID ${userId} not found`);
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        await client.query('COMMIT');
        console.log(`User ID ${userId} deleted successfully`);
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting user ID ${userId}: ${err.message}`);
        return res.status(500).json({ error: 'Server error during deletion', details: err.message });
    } finally {
        client.release();
    }
};

// Endpoint dla zakładki "Appointments"
const getAppointments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.id,
                a.appointment_time,
                a.status,
                a.client_id,
                u1.first_name AS client_first_name,
                u1.last_name AS client_last_name,
                a.barber_id,
                u2.first_name AS barber_first_name,
                u2.last_name AS barber_last_name,
                a.service_id,
                s.name AS service_name,
                s.price AS service_price,
                a.created_at
            FROM appointments a
            JOIN users u1 ON a.client_id = u1.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_time DESC
        `);
        const appointments = result.rows;
        res.json(appointments);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Aktualizacja wizyty
const updateAppointment = async (req, res) => {
    const { client_id, barber_id, service_id, appointment_time, status } = req.body;
    const appointmentId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE appointments SET client_id = $1, barber_id = $2, service_id = $3, appointment_time = $4, status = $5 WHERE id = $6 RETURNING *',
            [client_id, barber_id, service_id, appointment_time, status, appointmentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wizyta nie znaleziona' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuwanie wizyty
const deleteAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const client = await pool.connect(); // Rozpoczynamy transakcję

    try {
        console.log(`Attempting to delete appointment ID: ${appointmentId}`);
        await client.query('BEGIN'); // Rozpoczynanie transakcji

        // Usunięcie powiązanych rekordów z tabeli reviews
        const deleteReviewsResult = await client.query(
            'DELETE FROM reviews WHERE appointment_id = $1',
            [appointmentId]
        );
        console.log(`Deleted ${deleteReviewsResult.rowCount} reviews associated with appointment ID ${appointmentId}`);

        // Usunięcie wizyty z tabeli appointments
        const deleteAppointmentResult = await client.query(
            'DELETE FROM appointments WHERE id = $1 RETURNING id',
            [appointmentId]
        );

        if (deleteAppointmentResult.rowCount === 0) {
            console.log(`Appointment ID ${appointmentId} not found`);
            await client.query('ROLLBACK'); // Cofnięcie transakcji
            return res.status(404).json({ error: 'Appointment not found' });
        }

        await client.query('COMMIT'); // Zatwierdzenie transakcji
        console.log(`Appointment ID ${appointmentId} deleted successfully`);
        return res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK'); // Cofnięcie transakcji w przypadku błędu
        console.error(`Error deleting appointment ID ${appointmentId}: ${err.message}`);
        return res.status(500).json({ error: 'Server error during deletion', details: err.message });
    } finally {
        client.release(); // Zwolnienie klienta z puli połączeń
    }
};

// Endpoint dla zakładki "Services"
const getServices = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description, price, duration, created_at FROM services ORDER BY created_at DESC');
        const services = result.rows;
        res.json(services);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Dodawanie usługi
const addService = async (req, res) => {
    const { name, description, price, duration } = req.body;
    if (!name || !price || !duration) {
        return res.status(400).json({ error: 'Nazwa, cena i czas trwania są wymagane' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO services (name, description, price, duration) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, price, duration]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Aktualizacja usługi
const updateService = async (req, res) => {
    const { name, description, price, duration } = req.body;
    const serviceId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE services SET name = $1, description = $2, price = $3, duration = $4 WHERE id = $5 RETURNING *',
            [name, description, price, duration, serviceId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usługa nie znaleziona' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuwanie usługi
const deleteService = async (req, res) => {
    const serviceId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING id', [serviceId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usługa nie znaleziona' });
        }
        res.json({ message: 'Usługa usunięta' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Endpoint dla zakładki "Reviews"
const getReviews = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id,
                r.appointment_id,
                r.client_id,
                u1.first_name AS client_first_name,
                u1.last_name AS client_last_name,
                r.barber_id,
                u2.first_name AS barber_first_name,
                u2.last_name AS barber_last_name,
                r.service_id,
                s.name AS service_name,
                r.rating,
                r.comment,
                r.created_at
            FROM reviews r
            JOIN users u1 ON r.client_id = u1.id
            JOIN barbers b ON r.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);
        const reviews = result.rows.map(row => ({
            id: row.id,
            appointment_id: row.appointment_id,
            client_name: `${row.client_first_name} ${row.client_last_name}`,
            barber_name: `${row.barber_first_name} ${row.barber_last_name}`,
            service_name: row.service_name,
            rating: row.rating,
            comment: row.comment,
            created_at: row.created_at
        }));
        res.json(reviews);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuwanie recenzji
const deleteReview = async (req, res) => {
    const reviewId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [reviewId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Recenzja nie znaleziona' });
        }
        res.json({ message: 'Recenzja usunięta' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

module.exports = {
    getStats,
    getRevenue,
    getRecentActivities,
    getUsers,
    updateUser,
    deleteUser,
    getAppointments,
    updateAppointment,
    deleteAppointment,
    getServices,
    addService,
    updateService,
    deleteService,
    getReviews,
    deleteReview
};
