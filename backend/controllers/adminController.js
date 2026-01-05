const pool = require('../config/database');
const {
    format, subDays, startOfDay, endOfDay,
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addMinutes, parseISO, isValid: isValidDateFn,
    addDays, differenceInCalendarDays
} = require('date-fns');

// --- ZARZĄDZANIE UŻYTKOWNIKAMI (Z OSTATECZNĄ POPRAWKĄ) ---

const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getUsers (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania użytkowników.' });
    }
};

const updateUser = async (req, res) => {
    const { first_name, last_name, email, phone, role: incomingRole } = req.body;
    const userId = req.params.id;
    const client = await pool.connect();

    // Normalizacja roli – backend przyjmuje tylko: 'client', 'barber', 'admin'
    // Jeśli front wyśle 'user', zapisujemy to jako 'client'
    const allowedRoles = ['client', 'barber', 'admin'];
    let newRole = incomingRole === 'user' ? 'client' : incomingRole;

    // Dodatkowe zabezpieczenie: jeśli przyjdzie coś spoza listy, nie pozwalamy na zapis
    if (!allowedRoles.includes(newRole)) {
        return res
            .status(400)
            .json({ error: `Nieprawidłowa wartość roli: ${incomingRole}` });
    }

    try {
        await client.query('BEGIN');

        // 1. Pobierz aktualną rolę użytkownika PRZED zmianą
        const currentUserState = await client.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        if (currentUserState.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Użytkownik nie został znaleziony.' });
        }
        const oldRole = currentUserState.rows[0].role;

        // 2. Zaktualizuj dane w tabeli `users`
        const updatedUserResult = await client.query(
            'UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, role = $5 WHERE id = $6 RETURNING *',
            [first_name, last_name, email, phone, newRole, userId]
        );

        // 3. Zsynchronizuj tabelę `barbers`
        if (newRole === 'barber' && oldRole !== 'barber') {
            // Sprawdź, czy barber już istnieje, aby uniknąć błędu ON CONFLICT
            const existingBarber = await client.query(
                'SELECT id FROM barbers WHERE user_id = $1',
                [userId]
            );
            if (existingBarber.rows.length === 0) {
                // Jeśli nie istnieje, dodaj go
                await client.query(
                    'INSERT INTO barbers (user_id, email, phone) VALUES ($1, $2, $3)',
                    [userId, email, phone]
                );
            }
        } else if (newRole !== 'barber' && oldRole === 'barber') {
            // Użytkownik przestał być barberem - usuń go z tabeli barbers
            await client.query('DELETE FROM barbers WHERE user_id = $1', [userId]);
        }

        await client.query('COMMIT');
        res.json(updatedUserResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error in updateUser (AdminController):", err.stack);
        if (err.code === '23503') {
            // Foreign key violation
            return res.status(400).json({
                error:
                    'Nie można usunąć roli barbera. Barber ma przypisane wizyty – najpierw przypisz je innemu barberowi.',
            });
        }
        res.status(500).json({ error: 'Błąd serwera podczas aktualizacji użytkownika.' });
    } finally {
        client.release();
    }
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const appointmentsResult = await client.query(
            'SELECT id FROM appointments WHERE client_id = $1 OR barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        const appointmentIds = appointmentsResult.rows.map(row => row.id);

        if (appointmentIds.length > 0) {
            await client.query(
                'DELETE FROM reviews WHERE appointment_id = ANY($1::int[])',
                [appointmentIds]
            );
        }

        await client.query('DELETE FROM user_notifications WHERE user_id = $1', [userId]);
        await client.query(
            'DELETE FROM admin_notifications WHERE related_client_id = $1 OR related_barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        await client.query(
            'DELETE FROM notifications WHERE recipient_user_id = $1 OR barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        await client.query(
            'DELETE FROM appointments WHERE client_id = $1 OR barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        await client.query(
            'DELETE FROM portfolio_images WHERE barber_id IN (SELECT id FROM barbers WHERE user_id = $1)',
            [userId]
        );
        await client.query('DELETE FROM barbers WHERE user_id = $1', [userId]);

        const deleteUserResult = await client.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [userId]
        );

        if (deleteUserResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Użytkownik nie został znaleziony.' });
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Użytkownik i wszystkie powiązane dane zostały pomyślnie usunięte.',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting user ID ${userId}:`, err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas usuwania użytkownika.',
            details: err.message,
        });
    } finally {
        client.release();
    }
};

// --- FUNKCJE DLA DASHBOARDU (Z POPRAWKAMI) ---

const getStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM appointments WHERE status NOT IN ('canceled', 'completed', 'no-show', 'cancelled')) AS active_appointments, 
                (SELECT COUNT(*) FROM services WHERE is_active = TRUE) AS active_services,
                (SELECT COALESCE(SUM(s.price), 0) FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'completed' AND a.appointment_time >= date_trunc('month', CURRENT_DATE)) AS monthly_revenue;
        `;
        const result = await pool.query(query);
        const stats = result.rows[0];
        res.json({
            users: parseInt(stats.total_users, 10) || 0,
            activeAppointments: parseInt(stats.active_appointments, 10) || 0,
            services: parseInt(stats.active_services, 10) || 0,
            revenue: parseFloat(stats.monthly_revenue) || 0,
        });
    } catch (err) {
        console.error("Error in getStats (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd podczas pobierania statystyk.' });
    }
};

const getRevenue = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT TO_CHAR(appointment_time AT TIME ZONE 'UTC', 'YYYY-MM') AS month_year, SUM(price) AS amount
            FROM appointments JOIN services ON appointments.service_id = services.id
            WHERE appointments.status = 'completed'
            GROUP BY TO_CHAR(appointment_time AT TIME ZONE 'UTC', 'YYYY-MM') ORDER BY month_year ASC;
        `);
        const revenueData = result.rows.map(row => ({
            month: format(parseISO(row.month_year + '-01'), 'MMM'),
            amount: parseFloat(row.amount),
        }));
        res.json(revenueData);
    } catch (err) {
        console.error("Error in getRevenue (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd podczas pobierania danych o przychodach.' });
    }
};

const getReportData = async (req, res) => {
    const {
        timeRange: timeRangePreset,
        startDate: customStartDateStr,
        endDate: customEndDateStr,
    } = req.query;
    let queryStartDate,
        queryEndDate,
        loopStartDate,
        loopEndDate,
        outputDateFormat,
        effectiveTimeRangeType;

    try {
        if (timeRangePreset === 'custom') {
            if (
                !customStartDateStr ||
                !customEndDateStr ||
                !isValidDateFn(parseISO(customStartDateStr)) ||
                !isValidDateFn(parseISO(customEndDateStr))
            ) {
                return res
                    .status(400)
                    .json({ error: 'Nieprawidłowy zakres dat własnych.' });
            }
            queryStartDate = startOfDay(parseISO(customStartDateStr));
            queryEndDate = endOfDay(parseISO(customEndDateStr));
            if (queryStartDate > queryEndDate) {
                return res
                    .status(400)
                    .json({ error: 'Data początkowa nie może być późniejsza niż końcowa.' });
            }

            loopStartDate = queryStartDate;
            loopEndDate = queryEndDate;
            const diffDays = differenceInCalendarDays(queryEndDate, queryStartDate);
            effectiveTimeRangeType = diffDays === 0 ? 'hourly' : 'daily';
            outputDateFormat =
                effectiveTimeRangeType === 'daily'
                    ? diffDays <= 90
                        ? 'MM/dd'
                        : 'MMM dd'
                    : 'HH:00';
        } else {
            const today = new Date();
            loopEndDate = endOfDay(today);
            switch (timeRangePreset) {
                case '1day':
                    queryStartDate = startOfDay(today);
                    queryEndDate = endOfDay(today);
                    loopStartDate = queryStartDate;
                    effectiveTimeRangeType = 'hourly';
                    outputDateFormat = 'HH:00';
                    break;
                case '7days':
                    queryStartDate = startOfDay(subDays(today, 6));
                    queryEndDate = endOfDay(today);
                    loopStartDate = queryStartDate;
                    effectiveTimeRangeType = 'daily';
                    outputDateFormat = 'MM/dd';
                    break;
                default: // '1month'
                    queryStartDate = startOfMonth(today);
                    queryEndDate = endOfMonth(today);
                    loopStartDate = queryStartDate;
                    effectiveTimeRangeType = 'daily';
                    outputDateFormat = 'MMM dd';
                    break;
            }
        }

        let appointmentsQuery, queryParams;
        if (effectiveTimeRangeType === 'hourly') {
            // Zapytanie dla raportu godzinowego
            appointmentsQuery = `
                SELECT 
                    TO_CHAR(a.appointment_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:00:00') AS group_key, 
                    u_barber.first_name || ' ' || u_barber.last_name AS barber_name,
                    COUNT(a.id)::int AS appointments_count,
                    COALESCE(SUM(s.price), 0) AS revenue_sum
                FROM appointments a 
                JOIN services s ON a.service_id = s.id
                JOIN barbers b ON a.barber_id = b.id
                JOIN users u_barber ON b.user_id = u_barber.id
                WHERE a.status = 'completed' AND a.appointment_time >= $1 AND a.appointment_time < $2
                GROUP BY group_key, barber_name ORDER BY group_key ASC;`;
            queryParams = [queryStartDate, addDays(startOfDay(queryEndDate), 1)];
        } else {
            // Zapytanie dla raportu dziennego
            appointmentsQuery = `
                SELECT 
                    DATE(a.appointment_time AT TIME ZONE 'UTC') AS group_key, 
                    u_barber.first_name || ' ' || u_barber.last_name AS barber_name,
                    COUNT(a.id)::int AS appointments_count,
                    COALESCE(SUM(s.price), 0) AS revenue_sum
                FROM appointments a 
                JOIN services s ON a.service_id = s.id
                JOIN barbers b ON a.barber_id = b.id
                JOIN users u_barber ON b.user_id = u_barber.id
                WHERE a.status = 'completed' AND a.appointment_time >= $1 AND a.appointment_time <= $2
                GROUP BY group_key, barber_name ORDER BY group_key ASC;`;
            queryParams = [queryStartDate, queryEndDate];
        }

        const result = await pool.query(appointmentsQuery, queryParams);

        // Agregacja danych
        const processedData = result.rows.reduce((acc, row) => {
            const key =
                effectiveTimeRangeType === 'hourly'
                    ? row.group_key
                    : format(row.group_key, 'yyyy-MM-dd');
            if (!acc[key]) {
                acc[key] = { appointments: 0, revenue: 0, barbers: {} };
            }
            const count = parseInt(row.appointments_count, 10);
            const revenue = parseFloat(row.revenue_sum);
            acc[key].appointments += count;
            acc[key].revenue += revenue;
            if (row.barber_name) {
                acc[key].barbers[row.barber_name] =
                    (acc[key].barbers[row.barber_name] || 0) + count;
            }
            return acc;
        }, {});

        // Wypełnianie brakujących dni/godzin
        let finalReportData = [];
        let currentDateIter = startOfDay(loopStartDate);
        if (effectiveTimeRangeType === 'hourly') {
            for (let i = 0; i < 24; i++) {
                const hourKey = format(
                    addMinutes(currentDateIter, i * 60),
                    'yyyy-MM-dd HH:00:00'
                );
                const displayHour = format(
                    addMinutes(currentDateIter, i * 60),
                    outputDateFormat
                );
                finalReportData.push({
                    date: displayHour,
                    ...(processedData[hourKey] || {
                        appointments: 0,
                        revenue: 0,
                        barbers: {},
                    }),
                });
            }
        } else {
            while (currentDateIter <= loopEndDate) {
                const dateKey = format(currentDateIter, 'yyyy-MM-dd');
                const displayDate = format(currentDateIter, outputDateFormat);
                finalReportData.push({
                    date: displayDate,
                    ...(processedData[dateKey] || {
                        appointments: 0,
                        revenue: 0,
                        barbers: {},
                    }),
                });
                currentDateIter = addDays(currentDateIter, 1);
            }
        }
        res.json(finalReportData);
    } catch (err) {
        console.error("Error in getReportData (AdminController):", err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania danych raportu.',
        });
    }
};

// --- POZOSTAŁE FUNKCJE ---

const getAppointments = async (req, res) => {
    try {
        const {
            status,
            clientId,
            barberId,
            serviceId,
            date,
        } = req.query;

        // Budowanie warunków WHERE dynamicznie
        const whereClauses = [];
        const params = [];
        let idx = 1;

        if (status && status !== 'all') {
            whereClauses.push(`a.status = $${idx++}`);
            params.push(status);
        }

        if (clientId && clientId !== 'all') {
            whereClauses.push(`a.client_id = $${idx++}`);
            params.push(Number(clientId));
        }

        if (barberId && barberId !== 'all') {
            whereClauses.push(`a.barber_id = $${idx++}`);
            params.push(Number(barberId));
        }

        if (serviceId && serviceId !== 'all') {
            whereClauses.push(`a.service_id = $${idx++}`);
            params.push(Number(serviceId));
        }

        // date z frontu przychodzi w formacie 'YYYY-MM-DD'
        if (date) {
            // filtr na konkretny dzień wg czasu w bazie (tu przykład z >= i < następnego dnia)
            whereClauses.push(`DATE(a.appointment_time) = $${idx++}`);
            params.push(date);
        }

        const whereSql = whereClauses.length > 0
            ? 'WHERE ' + whereClauses.join(' AND ')
            : '';

        const query = `
            SELECT a.id, a.appointment_time, a.status, a.client_id, 
                   u1.first_name AS client_first_name, u1.last_name AS client_last_name, 
                   a.barber_id, u2.first_name AS barber_first_name, u2.last_name AS barber_last_name, 
                   a.service_id, s.name AS service_name, s.price AS service_price, a.created_at
            FROM appointments a
            JOIN users u1 ON a.client_id = u1.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON a.service_id = s.id
            ${whereSql}
            ORDER BY a.appointment_time DESC
        `;

        const result = await pool.query(query, params);

        res.json(
            result.rows.map(apt => ({
                ...apt,
                service_price: parseFloat(apt.service_price),
            }))
        );
    } catch (err) {
        console.error("Error in getAppointments (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania wizyt.' });
    }
};


const updateAppointment = async (req, res) => {
    const { client_id, barber_id, service_id, appointment_time, status } = req.body;
    const appointmentId = req.params.id;

    if (!client_id || !barber_id || !service_id || !appointment_time || !status) {
        return res.status(400).json({
            error: 'Klient, barber, usługa, czas i status są wymagane.',
        });
    }

    try {
        const result = await pool.query(
            'UPDATE appointments SET client_id = $1, barber_id = $2, service_id = $3, appointment_time = $4, status = $5 WHERE id = $6 RETURNING *;',
            [client_id, barber_id, service_id, appointment_time, status, appointmentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wizyta nie została znaleziona.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in updateAppointment (AdminController):", err.stack);
        if (err.code === '23503') {
            return res.status(400).json({
                error: `Nieprawidłowe dane wejściowe. Szczegóły: ${err.detail}`,
            });
        }
        res.status(500).json({ error: 'Błąd serwera podczas aktualizacji wizyty.' });
    }
};

const deleteAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM reviews WHERE appointment_id = $1', [
            appointmentId,
        ]);
        const deleteResult = await client.query(
            'DELETE FROM appointments WHERE id = $1 RETURNING id',
            [appointmentId]
        );
        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Wizyta nie została znaleziona.' });
        }
        await client.query('COMMIT');
        res.status(200).json({
            message: 'Wizyta została pomyślnie usunięta.',
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting appointment ID ${appointmentId}:`, err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas usuwania wizyty.',
        });
    } finally {
        client.release();
    }
};

const getServices = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, price, duration, created_at, is_active FROM services ORDER BY name ASC'
        );
        res.json(
            result.rows.map(s => ({
                ...s,
                price: parseFloat(s.price),
            }))
        );
    } catch (err) {
        console.error("Error in getServices (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania usług.' });
    }
};

const addService = async (req, res) => {
    const { name, description, price, duration, is_active = true, photo_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO services (name, description, price, duration, is_active, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
                name,
                description,
                parseFloat(price),
                parseInt(duration),
                is_active,
                photo_url || null,
            ]
        );
        res.status(201).json({
            ...result.rows[0],
            price: parseFloat(result.rows[0].price),
        });
    } catch (err) {
        console.error("Error in addService (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas dodawania usługi.' });
    }
};

const updateService = async (req, res) => {
    const { name, description, price, duration, is_active, photo_url } = req.body;
    const serviceId = req.params.id;

    try {
        // Pobierz aktualny rekord
        const existing = await pool.query(
            'SELECT is_active FROM services WHERE id = $1',
            [serviceId]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Usługa nie została znaleziona.' });
        }

        const currentIsActive = existing.rows[0].is_active;
        const normalizedIsActive =
            typeof is_active === 'boolean' ? is_active :
                currentIsActive === null ? true : currentIsActive;

        const result = await pool.query(
            `UPDATE services 
             SET name = $1, description = $2, price = $3, duration = $4, 
                 is_active = $5, photo_url = $6 
             WHERE id = $7 
             RETURNING *`,
            [
                name,
                description,
                parseFloat(price),
                parseInt(duration, 10),
                normalizedIsActive,
                photo_url || null,
                serviceId,
            ]
        );

        res.json({
            ...result.rows[0],
            price: parseFloat(result.rows[0].price),
        });
    } catch (err) {
        console.error("Error in updateService (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas aktualizacji usługi.' });
    }
};

const deleteService = async (req, res) => {
    const serviceId = req.params.id;
    try {
        await pool.query('DELETE FROM services WHERE id = $1', [serviceId]);
        res.json({ message: 'Usługa została usunięta.' });
    } catch (err) {
        console.error("Error in deleteService (AdminController):", err.stack);
        if (err.code === '23503') {
            return res.status(400).json({
                error:
                    'Nie można usunąć usługi powiązanej z istniejącymi wizytami. Rozważ jej dezaktywację.',
            });
        }
        res.status(500).json({ error: 'Błąd serwera podczas usuwania usługi.' });
    }
};

const getReviews = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.rating, r.comment, r.created_at, 
                   u1.first_name AS client_first_name, u1.last_name AS client_last_name, 
                   u2.first_name AS barber_first_name, u2.last_name AS barber_last_name, 
                   s.name AS service_name
            FROM reviews r
            JOIN users u1 ON r.client_id = u1.id
            JOIN barbers b ON r.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);
        res.json(
            result.rows.map(row => ({
                id: row.id,
                client_name: `${row.client_first_name} ${row.client_last_name}`,
                barber_name: `${row.barber_first_name} ${row.barber_last_name}`,
                service_name: row.service_name,
                rating: row.rating,
                comment: row.comment,
                created_at: row.created_at,
            }))
        );
    } catch (err) {
        console.error("Error in getReviews (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania recenzji.' });
    }
};

const deleteReview = async (req, res) => {
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
        res.json({ message: 'Recenzja została usunięta.' });
    } catch (err) {
        console.error("Error in deleteReview (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas usuwania recenzji.' });
    }
};

// --- POWIADOMIENIA ADMINA ---

const getAdminNotifications = async (req, res) => {
    const adminUserId = req.user?.id;
    try {
        const result = await pool.query(
            `SELECT id, type, title, message, link, is_read, created_at 
             FROM admin_notifications 
             WHERE (admin_user_id = $1 OR admin_user_id IS NULL) 
             ORDER BY is_read ASC, created_at DESC 
             LIMIT 50`,
            [adminUserId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getAdminNotifications (AdminController):", err.stack);
        res.status(500).json({
            error: 'Błąd podczas pobierania powiadomień administratora.',
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.id;
    try {
        const result = await pool.query(
            'UPDATE admin_notifications SET is_read = TRUE WHERE id = $1 AND (admin_user_id = $2 OR admin_user_id IS NULL) RETURNING id',
            [id, adminUserId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Powiadomienie nie istnieje lub nie masz do niego uprawnień.',
            });
        }
        res.status(200).json({ message: 'Powiadomienie zostało oznaczone jako przeczytane.' });
    } catch (err) {
        console.error('Error marking notification as read:', err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas oznaczania powiadomienia.' });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    const adminUserId = req.user.id;
    try {
        await pool.query(
            'UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE AND (admin_user_id = $1 OR admin_user_id IS NULL)',
            [adminUserId]
        );
        res
            .status(200)
            .json({ message: 'Wszystkie powiadomienia zostały oznaczone jako przeczytane.' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas oznaczania wszystkich powiadomień.',
        });
    }
};

const deleteNotification = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.id;
    try {
        const result = await pool.query(
            'DELETE FROM admin_notifications WHERE id = $1 AND (admin_user_id = $2 OR admin_user_id IS NULL) RETURNING id',
            [id, adminUserId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Powiadomienie nie istnieje lub nie masz do niego uprawnień.',
            });
        }
        res.status(200).json({ message: 'Powiadomienie zostało usunięte.' });
    } catch (err) {
        console.error('Error deleting notification:', err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas usuwania powiadomienia.' });
    }
};

const getBarbersForSelect = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.id, u.first_name, u.last_name
            FROM barbers b
            JOIN users u ON b.user_id = u.id
            WHERE u.role = 'barber'
            ORDER BY u.last_name, u.first_name;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getBarbersForSelect (AdminController):", err.stack);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania listy barberów.',
        });
    }
};

module.exports = {
    getStats,
    getRevenue,
    getAdminNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
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
    deleteReview,
    getReportData,
    getBarbersForSelect,
};
