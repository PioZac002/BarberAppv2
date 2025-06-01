const pool = require('../config/database');
// Zmieniony import, aby bezpośrednio używać 'addDays'
const {
    format, subDays, startOfDay, endOfDay,
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addMinutes, parseISO, isValid: isValidDateFn,
    addDays, differenceInCalendarDays // UPEWNIJ SIĘ, ŻE JEST TUTAJ
} = require('date-fns');

const getStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM appointments WHERE status NOT IN ('canceled', 'completed', 'no-show', 'cancelled')) AS activeAppointments, 
                (SELECT COUNT(*) FROM services WHERE is_active = TRUE) AS services,
                (SELECT COALESCE(SUM(s.price), 0) FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'completed') AS revenue
        `);
        const stats = result.rows[0];
        stats.users = parseInt(stats.users, 10) || 0;
        // Zakładając, że PostgreSQL zwraca małe litery dla aliasów bez cudzysłowów
        stats.activeappointments = parseInt(stats.activeappointments, 10) || 0;
        stats.services = parseInt(stats.services, 10) || 0;
        stats.revenue = parseFloat(stats.revenue) || 0;

        res.json({
            users: stats.users,
            activeAppointments: stats.activeappointments,
            services: stats.services,
            revenue: stats.revenue
        });
    } catch (err) {
        console.error("Error in getStats (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania statystyk' });
    }
};

const getRevenue = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(appointment_time AT TIME ZONE 'UTC', 'YYYY-MM') AS month_year,
                SUM(price) AS amount
            FROM appointments
            JOIN services ON appointments.service_id = services.id
            WHERE appointments.status = 'completed'
            GROUP BY TO_CHAR(appointment_time AT TIME ZONE 'UTC', 'YYYY-MM')
            ORDER BY month_year ASC;
        `);
        const revenueData = result.rows.map(row => ({
            month: format(parseISO(row.month_year + '-01'), 'MMM'),
            amount: parseFloat(row.amount)
        }));
        res.json(revenueData);
    } catch (err) {
        console.error("Error in getRevenue (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania przychodów' });
    }
};

const getAdminNotifications = async (req, res) => {
    const adminUserId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT id, type, title, message, link, related_appointment_id, related_client_id, related_barber_id, is_read, created_at 
             FROM admin_notifications 
             WHERE admin_user_id = $1 OR admin_user_id IS NULL
             ORDER BY created_at DESC LIMIT 20`,
            [adminUserId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getAdminNotifications (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania powiadomień administratora' });
    }
};


const getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getUsers (AdminController):",err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

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
        console.error("Error in updateUser (AdminController):",err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const appointmentsResult = await client.query(
            'SELECT id FROM appointments WHERE client_id = $1 OR barber_id IN (SELECT id FROM barbers WHERE user_id = $1)', [userId]
        );
        const appointmentIds = appointmentsResult.rows.map(row => row.id);
        if (appointmentIds.length > 0) {
            await client.query('DELETE FROM reviews WHERE appointment_id = ANY($1::int[])', [appointmentIds]);
        }
        await client.query('DELETE FROM user_notifications WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM admin_notifications WHERE related_client_id = $1 OR related_barber_id IN (SELECT id FROM barbers WHERE user_id = $1)', [userId]);
        await client.query('DELETE FROM admin_notifications WHERE admin_user_id = $1', [userId]);
        await client.query('DELETE FROM appointments WHERE client_id = $1', [userId]);
        await client.query('DELETE FROM appointments WHERE barber_id IN (SELECT id FROM barbers WHERE user_id = $1)', [userId]);
        await client.query('DELETE FROM portfolio_images WHERE barber_id IN (SELECT id FROM barbers WHERE user_id = $1)', [userId]);
        await client.query('DELETE FROM notifications WHERE barber_id IN (SELECT id FROM barbers WHERE user_id = $1) OR recipient_user_id = $1', [userId]);
        await client.query('DELETE FROM barbers WHERE user_id = $1', [userId]);
        const deleteUserResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (deleteUserResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'User and all related data deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting user ID ${userId}:`, err.stack);
        res.status(500).json({ error: 'Server error during user deletion', details: err.message });
    } finally {
        client.release();
    }
};

const getAppointments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.id, a.appointment_time, a.status, a.client_id,
                u1.first_name AS client_first_name, u1.last_name AS client_last_name,
                a.barber_id, u2.first_name AS barber_first_name, u2.last_name AS barber_last_name,
                a.service_id, s.name AS service_name, s.price AS service_price, a.created_at
            FROM appointments a
            JOIN users u1 ON a.client_id = u1.id
            JOIN barbers b ON a.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_time DESC
        `);
        res.json(result.rows.map(apt => ({...apt, service_price: parseFloat(apt.service_price)})));
    } catch (err) {
        console.error("Error in getAppointments (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const deleteAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM reviews WHERE appointment_id = $1', [appointmentId]);
        await client.query('DELETE FROM admin_notifications WHERE related_appointment_id = $1', [appointmentId]);
        const deleteAppointmentResult = await client.query('DELETE FROM appointments WHERE id = $1 RETURNING id', [appointmentId]);
        if (deleteAppointmentResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found' });
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Appointment and related records deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting appointment ID ${appointmentId}:`, err.stack);
        res.status(500).json({ error: 'Server error during appointment deletion', details: err.message });
    } finally {
        client.release();
    }
};

const getServices = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description, price, duration, created_at, is_active FROM services ORDER BY name ASC');
        res.json(result.rows.map(s => ({...s, price: parseFloat(s.price)})));
    } catch (err) {
        console.error("Error in getServices (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const addService = async (req, res) => {
    const { name, description, price, duration, is_active = true, photo_url } = req.body;
    if (!name || price === undefined || duration === undefined) {
        return res.status(400).json({ error: 'Nazwa, cena i czas trwania są wymagane' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO services (name, description, price, duration, is_active, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, parseFloat(price), parseInt(duration), is_active, photo_url || null]
        );
        res.status(201).json({...result.rows[0], price: parseFloat(result.rows[0].price)});
    } catch (err) {
        console.error("Error in addService (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const updateService = async (req, res) => {
    const { name, description, price, duration, is_active, photo_url } = req.body;
    const serviceId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE services SET name = $1, description = $2, price = $3, duration = $4, is_active = $5, photo_url = $6 WHERE id = $7 RETURNING *',
            [name, description, parseFloat(price), parseInt(duration), is_active, photo_url, serviceId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usługa nie znaleziona' });
        }
        res.json({...result.rows[0], price: parseFloat(result.rows[0].price)});
    } catch (err) {
        console.error("Error in updateService (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const deleteService = async (req, res) => {
    const serviceId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const appointmentsCheck = await client.query('SELECT COUNT(*) FROM appointments WHERE service_id = $1', [serviceId]);
        if (parseInt(appointmentsCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cannot delete service with existing appointments. Consider deactivating it instead.' });
        }
        const result = await client.query('DELETE FROM services WHERE id = $1 RETURNING id', [serviceId]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usługa nie znaleziona' });
        }
        await client.query('COMMIT');
        res.json({ message: 'Usługa usunięta' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error in deleteService (AdminController):", err.stack);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete service. It is referenced in other records. Consider deactivating it.' });
        }
        res.status(500).json({ error: 'Błąd serwera' });
    } finally {
        client.release();
    }
};

const getReviews = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.appointment_id, r.client_id,
                   u1.first_name AS client_first_name, u1.last_name AS client_last_name,
                   r.barber_id, u2.first_name AS barber_first_name, u2.last_name AS barber_last_name,
                   r.service_id, s.name AS service_name,
                   r.rating, r.comment, r.created_at
            FROM reviews r
            JOIN users u1 ON r.client_id = u1.id
            JOIN barbers b ON r.barber_id = b.id
            JOIN users u2 ON b.user_id = u2.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows.map(row => ({
            id: row.id, appointment_id: row.appointment_id,
            client_name: `${row.client_first_name} ${row.client_last_name}`,
            barber_name: `${row.barber_first_name} ${row.barber_last_name}`,
            service_name: row.service_name,
            rating: row.rating, comment: row.comment, created_at: row.created_at
        })));
    } catch (err) {
        console.error("Error in getReviews (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const deleteReview = async (req, res) => {
    const reviewId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [reviewId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Recenzja nie znaleziona' });
        }
        res.json({ message: 'Recenzja usunięta' });
    } catch (err) {
        console.error("Error in deleteReview (AdminController):", err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const updateAppointment = async (req, res) => {
    const adminPerformingActionUserId = req.user.id;
    const { client_id, barber_id, service_id, appointment_time, status: newStatus } = req.body;
    const appointmentId = req.params.id;

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled', 'no-show'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ error: 'Invalid or missing status provided for update.' });
    }
    if (!client_id || !barber_id || !service_id || !appointment_time) {
        return res.status(400).json({ error: 'Client, barber, service, and appointment time are required for update.'});
    }

    let pgClient;
    try {
        pgClient = await pool.connect();
        await pgClient.query('BEGIN');

        const adminPerformingActionResult = await pgClient.query('SELECT first_name, last_name FROM users WHERE id = $1 AND role = \'admin\'', [adminPerformingActionUserId]);
        if (adminPerformingActionResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(403).json({ error: 'Admin performing action not found or not an admin.' });
        }
        const adminPerformingActionName = `${adminPerformingActionResult.rows[0].first_name} ${adminPerformingActionResult.rows[0].last_name}`;

        const updateQuery = `
            UPDATE appointments 
            SET client_id = $1, barber_id = $2, service_id = $3, appointment_time = $4, status = $5 
            WHERE id = $6 
            RETURNING id, client_id, barber_id, service_id, appointment_time, status,
                      (SELECT name FROM services WHERE id = $3) AS service_name,
                      (SELECT user_id FROM barbers WHERE id = $2) AS target_barber_user_id,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = $1) AS client_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = (SELECT user_id FROM barbers WHERE id = $2)) AS target_barber_name;
        `;
        const result = await pgClient.query(updateQuery,
            [client_id, barber_id, service_id, appointment_time, newStatus, appointmentId]
        );

        if (result.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found for update by admin.' });
        }
        const updatedAppointment = result.rows[0];
        const appointmentTimeFormatted = format(parseISO(updatedAppointment.appointment_time), "MMM d,<y_bin_46> 'at' h:mm a");
        const serviceName = updatedAppointment.service_name;
        const clientName = updatedAppointment.client_name;
        const targetBarberName = updatedAppointment.target_barber_name;
        const targetBarberUserId = updatedAppointment.target_barber_user_id;

        if (newStatus === 'confirmed') {
            const clientNotificationTitle = "Appointment Confirmed by Admin!";
            const clientMessage = `Your appointment for ${serviceName} with ${targetBarberName} on ${appointmentTimeFormatted} has been confirmed by the administration.`;
            await pgClient.query(
                `INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
                [updatedAppointment.client_id, 'appointment_confirmed_by_admin', clientNotificationTitle, clientMessage, `/user-dashboard/appointments`]
            );

            const barberNotificationTitle = "Appointment Confirmed by Admin";
            const barberMessage = `The appointment for ${clientName} (${serviceName}) on ${appointmentTimeFormatted} has been confirmed by admin ${adminPerformingActionName}. (Appt ID: ${appointmentId})`;
            if (updatedAppointment.barber_id && targetBarberUserId) {
                await pgClient.query(
                    `INSERT INTO notifications (barber_id, recipient_user_id, type, title, message, link, is_read, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())`,
                    [
                        updatedAppointment.barber_id,
                        targetBarberUserId,
                        'appointment_confirmed_by_admin_staff',
                        barberNotificationTitle,
                        barberMessage,
                        `/barber-dashboard/schedule`
                    ]
                );
            }

            const otherAdminNotificationTitle = "Appointment Confirmed (Admin Action)";
            const otherAdminMessage = `Appointment ID ${appointmentId} (Client: ${clientName}, Barber: ${targetBarberName}) has been confirmed by admin ${adminPerformingActionName}.`;
            const adminLink = `/admin-dashboard/appointments?appointmentId=${appointmentId}`;
            const adminUsersResult = await pgClient.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of adminUsersResult.rows) {
                if (admin.id !== adminPerformingActionUserId) {
                    await pgClient.query(
                        `INSERT INTO admin_notifications (admin_user_id, type, title, message, link, related_appointment_id, related_client_id, related_barber_id, is_read, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())`,
                        [
                            admin.id,
                            'appointment_confirmed_log',
                            otherAdminNotificationTitle,
                            otherAdminMessage,
                            adminLink,
                            appointmentId,
                            updatedAppointment.client_id,
                            updatedAppointment.barber_id
                        ]
                    );
                }
            }
        }

        await pgClient.query('COMMIT');
        res.json(updatedAppointment);

    } catch (err) {
        if (pgClient) {
            await pgClient.query('ROLLBACK');
        }
        console.error("Error in updateAppointment (AdminController):", err.stack);
        res.status(500).json({ error: 'Server error updating appointment by admin' });
    } finally {
        if (pgClient) {
            pgClient.release();
        }
    }
};

const getReportData = async (req, res) => {
    const { timeRange: timeRangePreset, startDate: customStartDateStr, endDate: customEndDateStr } = req.query;

    let queryStartDate, queryEndDate;
    let loopStartDate, loopEndDate;
    let outputDateFormat;
    let effectiveTimeRangeType;

    if (timeRangePreset === 'custom') {
        if (customStartDateStr && customEndDateStr &&
            isValidDateFn(parseISO(customStartDateStr)) && isValidDateFn(parseISO(customEndDateStr))) {

            loopStartDate = startOfDay(parseISO(customStartDateStr));
            loopEndDate = endOfDay(parseISO(customEndDateStr));

            queryStartDate = loopStartDate;
            queryEndDate = loopEndDate;

            if (queryStartDate > queryEndDate) {
                return res.status(400).json({ error: 'Start date cannot be after end date for custom range.' });
            }

            // Użycie funkcji 'differenceInCalendarDays'
            const diffDays = differenceInCalendarDays(queryEndDate, queryStartDate);

            if (diffDays === 0) {
                effectiveTimeRangeType = 'hourly';
                outputDateFormat = "HH:00";
            } else if (diffDays <= 35 * 3) {
                effectiveTimeRangeType = 'daily';
                outputDateFormat = "MM/dd";
            } else {
                effectiveTimeRangeType = 'daily';
                outputDateFormat = "MMM dd";
            }
        } else {
            return res.status(400).json({ error: 'Invalid custom date range provided. Ensure both start and end dates are valid.' });
        }
    } else {
        loopEndDate = endOfDay(new Date());
        switch (timeRangePreset) {
            case '1day':
                queryStartDate = startOfDay(new Date());
                queryEndDate = endOfDay(new Date());
                loopStartDate = queryStartDate;
                outputDateFormat = "HH:00";
                effectiveTimeRangeType = 'hourly';
                break;
            case '7days':
                queryStartDate = startOfDay(subDays(new Date(), 6));
                loopStartDate = queryStartDate;
                // queryEndDate jest już endOfDay(new Date())
                outputDateFormat = "MM/dd";
                effectiveTimeRangeType = 'daily';
                break;
            case '1month':
                queryStartDate = startOfMonth(new Date());
                queryEndDate = endOfMonth(new Date());
                loopStartDate = queryStartDate;
                loopEndDate = queryEndDate;
                outputDateFormat = "MMM dd";
                effectiveTimeRangeType = 'daily';
                break;
            default: // Domyślnie 7 dni
                queryStartDate = startOfDay(subDays(new Date(), 6));
                loopStartDate = queryStartDate;
                // queryEndDate jest już endOfDay(new Date())
                outputDateFormat = "MM/dd";
                effectiveTimeRangeType = 'daily';
        }
    }

    try {
        let appointmentsQuery;
        let queryParams = [queryStartDate, queryEndDate];

        if (effectiveTimeRangeType === 'hourly') {
            appointmentsQuery = `
                SELECT 
                    TO_CHAR(a.appointment_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:00:00') AS group_key_str, 
                    COUNT(a.id) AS appointments_count,
                    COALESCE(SUM(s.price), 0) AS revenue_sum,
                    u_barber.first_name || ' ' || u_barber.last_name AS barber_name
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN barbers b ON a.barber_id = b.id
                JOIN users u_barber ON b.user_id = u_barber.id
                WHERE a.status = 'completed' 
                  AND a.appointment_time >= $1 
                  AND a.appointment_time < $2 
                GROUP BY group_key_str, u_barber.first_name, u_barber.last_name
                ORDER BY group_key_str ASC;
            `;
            queryParams = [queryStartDate, startOfDay(addDays(loopEndDate, 1))];

        } else { // daily
            appointmentsQuery = `
                SELECT 
                    DATE(a.appointment_time AT TIME ZONE 'UTC') AS group_key_date, 
                    COUNT(a.id) AS appointments_count,
                    COALESCE(SUM(s.price), 0) AS revenue_sum,
                    u_barber.first_name || ' ' || u_barber.last_name AS barber_name
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN barbers b ON a.barber_id = b.id
                JOIN users u_barber ON b.user_id = u_barber.id
                WHERE a.status = 'completed' 
                  AND a.appointment_time >= $1 AND a.appointment_time <= $2
                GROUP BY group_key_date, u_barber.first_name, u_barber.last_name
                ORDER BY group_key_date ASC;
            `;
            queryParams = [queryStartDate, queryEndDate];
        }

        const result = await pool.query(appointmentsQuery, queryParams);

        const processedDataByGroupKey = {};
        result.rows.forEach(row => {
            const groupKey = effectiveTimeRangeType === 'hourly'
                ? row.group_key_str
                // Dla 'daily', PostgreSQL zwraca obiekt Date dla DATE(), więc formatujemy go od razu
                : format(new Date(row.group_key_date), 'yyyy-MM-dd');


            if (!processedDataByGroupKey[groupKey]) {
                processedDataByGroupKey[groupKey] = {
                    raw_date_obj: parseISO(groupKey),
                    appointments: 0,
                    revenue: 0,
                    barbers: {}
                };
            }
            processedDataByGroupKey[groupKey].appointments += parseInt(row.appointments_count, 10);
            processedDataByGroupKey[groupKey].revenue += parseFloat(row.revenue_sum);
            processedDataByGroupKey[groupKey].barbers[row.barber_name] = (processedDataByGroupKey[groupKey].barbers[row.barber_name] || 0) + parseInt(row.appointments_count, 10);
        });

        let finalReportData = [];
        let currentDateIter = startOfDay(loopStartDate); // Używamy loopStartDate do iteracji

        if (effectiveTimeRangeType === 'hourly') {
            const dayToReport = loopStartDate; // Dla raportu godzinowego, iterujemy po godzinach dnia loopStartDate
            for (let i = 0; i < 24; i++) {
                currentDateIter = addMinutes(startOfDay(dayToReport), i * 60);
                const hourKey = format(currentDateIter, 'yyyy-MM-dd HH24:00:00');
                const displayHour = format(currentDateIter, outputDateFormat); // "HH:00"

                if (processedDataByGroupKey[hourKey]) {
                    finalReportData.push({
                        ...processedDataByGroupKey[hourKey],
                        date: displayHour // Nadpisz 'raw_date_obj' sformatowaną datą/godziną
                    });
                } else {
                    finalReportData.push({ date: displayHour, appointments: 0, revenue: 0, barbers: {} });
                }
            }
        } else { // daily
            while(currentDateIter <= loopEndDate) { // Używamy loopEndDate
                const dateKey = format(currentDateIter, 'yyyy-MM-dd'); // Klucz do porównania
                const displayDate = format(currentDateIter, outputDateFormat);

                if (processedDataByGroupKey[dateKey]) {
                    finalReportData.push({
                        ...processedDataByGroupKey[dateKey],
                        date: displayDate // Nadpisz 'raw_date_obj' sformatowaną datą
                    });
                } else {
                    finalReportData.push({ date: displayDate, appointments: 0, revenue: 0, barbers: {} });
                }
                currentDateIter = addDays(currentDateIter, 1);
            }
        }

        // Usuń pole pomocnicze raw_date_obj przed wysłaniem do frontendu
        finalReportData = finalReportData.map(({ raw_date_obj, ...rest }) => rest);
        res.json(finalReportData);

    } catch (err) {
        console.error("Error in getReportData (AdminController):", err.stack);
        res.status(500).json({ error: 'Server error fetching report data.' });
    }
};


module.exports = {
    getStats,
    getRevenue,
    getAdminNotifications,
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
    getReportData
};