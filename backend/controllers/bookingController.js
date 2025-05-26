const pool = require('../config/database');
const { parse, format, addMinutes, isValid: isValidDateFn } = require('date-fns');

// Funkcja generateTimeSlots
const generateTimeSlots = (startTimeStr, endTimeStr, slotIntervalMinutes, serviceDurationMinutes) => {
    const slots = [];
    if (!startTimeStr || !endTimeStr || !/^\d{2}:\d{2}$/.test(startTimeStr) || !/^\d{2}:\d{2}$/.test(endTimeStr)) {
        console.error("Invalid start or end time string for generateTimeSlots:", startTimeStr, endTimeStr);
        return [];
    }
    try {
        let currentTime = parse(startTimeStr, 'HH:mm', new Date());
        const endTime = parse(endTimeStr, 'HH:mm', new Date());

        while (currentTime < endTime) {
            const slotEndTime = addMinutes(currentTime, serviceDurationMinutes);
            if (slotEndTime > endTime) {
                break;
            }
            slots.push(format(currentTime, 'HH:mm'));
            currentTime = addMinutes(currentTime, slotIntervalMinutes);
        }
    } catch (error) {
        console.error("Error generating time slots:", error);
        return [];
    }
    return slots;
};

// Pobieranie usług
exports.getServicesForBooking = async (req, res) => {
    try {
        // Jeśli nie masz kolumny is_active, usuń warunek WHERE is_active = TRUE
        const result = await pool.query(
            'SELECT id, name, description, duration, price, photo_url AS image FROM services WHERE is_active = TRUE ORDER BY name'
        );
        const services = result.rows.map(s => ({
            ...s,
            price: parseFloat(s.price)
        }));
        res.json(services);
    } catch (err) {
        console.error("Error in getServicesForBooking:", err.stack);
        res.status(500).json({ error: 'Server error fetching services. Check backend logs.' });
    }
};

// Pobieranie barberów
exports.getBarbersForBooking = async (req, res) => {
    try {
        const query = `
            SELECT 
                b.id, 
                u.first_name, 
                u.last_name,
                COALESCE(b.job_title, 'Barber') AS role,
                COALESCE(b.profile_image_url, 'https://via.placeholder.com/150/CCCCCC/808080?Text=No+Image') AS image,
                b.experience AS experience_text, 
                COALESCE(br.avg_rating, 0.0) AS rating
            FROM barbers b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating),1) as avg_rating FROM reviews GROUP BY barber_id
            ) br ON br.barber_id = b.id
            ORDER BY u.first_name, u.last_name; 
        `;
        const result = await pool.query(query);

        const barbers = result.rows.map(b_row => ({
            id: b_row.id,
            name: `${b_row.first_name} ${b_row.last_name}`,
            role: b_row.role,
            rating: parseFloat(b_row.rating) || 0,
            experience: parseInt(b_row.experience_text, 10) || 0,
            image: b_row.image
        }));
        res.json(barbers);
    } catch (err) {
        console.error("Error in getBarbersForBooking:", err.stack);
        res.status(500).json({ error: 'Server error fetching barbers. Check backend logs.' });
    }
};

// Pobieranie dostępnych slotów czasowych
exports.getAvailableTimeSlots = async (req, res) => {
    const { date, serviceId, barberId } = req.query;

    if (!date || !serviceId || !barberId) {
        return res.status(400).json({ error: 'Date, serviceId, and barberId are required.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    try {
        const serviceResult = await pool.query('SELECT duration FROM services WHERE id = $1 AND is_active = TRUE', [serviceId]);
        if (serviceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found or is not active.' });
        }
        const serviceDurationMinutes = parseInt(serviceResult.rows[0].duration, 10);

        const barberWorkingHoursResult = await pool.query('SELECT working_hours FROM barbers WHERE id = $1', [barberId]);
        let workStartStr = "09:00", workEndStr = "17:00";
        if (barberWorkingHoursResult.rows.length > 0 && barberWorkingHoursResult.rows[0].working_hours) {
            const parts = barberWorkingHoursResult.rows[0].working_hours.split('-');
            if (parts.length === 2 && /^\d{2}:\d{2}$/.test(parts[0]) && /^\d{2}:\d{2}$/.test(parts[1])) {
                workStartStr = parts[0];
                workEndStr = parts[1];
            } else {
                console.warn(`Invalid working_hours format for barber ${barberId}: ${barberWorkingHoursResult.rows[0].working_hours}. Using default.`);
            }
        } else {
            console.warn(`Working hours not set for barber ${barberId}. Using default.`);
        }

        const slotIntervalMinutes = 30;
        const allPossibleSlots = generateTimeSlots(workStartStr, workEndStr, slotIntervalMinutes, serviceDurationMinutes);

        const appointmentsResult = await pool.query(
            `SELECT appointment_time, 
                    (SELECT duration FROM services s_apt WHERE s_apt.id = a.service_id) as duration 
             FROM appointments a 
             WHERE barber_id = $1 AND DATE(appointment_time AT TIME ZONE 'UTC') = $2 AND status NOT IN ('canceled', 'cancelled', 'no-show')`,
            [barberId, date]
        );

        const bookedSlots = appointmentsResult.rows.map(apt => {
            const aptDate = new Date(apt.appointment_time);
            const startTime = parse(format(aptDate, 'HH:mm'), 'HH:mm', new Date(date));
            return {
                start: startTime,
                end: addMinutes(startTime, parseInt(apt.duration, 10))
            };
        });

        const availableSlots = allPossibleSlots.filter(slotStr => {
            const slotStartDateTime = parse(slotStr, 'HH:mm', new Date(date));
            const slotEndDateTime = addMinutes(slotStartDateTime, serviceDurationMinutes);
            const isBooked = bookedSlots.some(bookedSlot => slotStartDateTime < bookedSlot.end && slotEndDateTime > bookedSlot.start);
            return !isBooked;
        });

        const formattedAvailableSlots = availableSlots.map(slot => format(parse(slot, 'HH:mm', new Date()), 'h:mm a'));
        res.json(formattedAvailableSlots);

    } catch (err) {
        console.error("Error in getAvailableTimeSlots:", err.stack);
        res.status(500).json({ error: 'Server error fetching time slots. Check backend logs.' });
    }
};

// Tworzenie rezerwacji z powiadomieniami
exports.createBooking = async (req, res) => {
    const clientUserId = req.user.id;
    const { serviceId, barberId, date, timeSlot, notes } = req.body; // barberId to ID z tabeli barbers

    if (!serviceId || !barberId || !date || !timeSlot) {
        return res.status(400).json({ error: 'Service, barber, date, and time slot are required.' });
    }

    let pgClient;
    try {
        pgClient = await pool.connect();
        await pgClient.query('BEGIN');

        const parsedTime = parse(timeSlot, 'h:mm a', new Date());
        const datePart = date.split('T')[0];
        const localDateTime = new Date(`${datePart}T${format(parsedTime, 'HH:mm:ss')}`);

        if (!isValidDateFn(localDateTime)) {
            await pgClient.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid date or time format provided.' });
        }

        const appointmentInsertQuery = `
            INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, appointment_time,
                      (SELECT name FROM services WHERE id = $3) AS service_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = $1) as client_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = (SELECT user_id FROM barbers WHERE id = $2)) as target_barber_name;
        `;
        const newAppointmentResult = await pgClient.query(appointmentInsertQuery,
            [clientUserId, barberId, serviceId, localDateTime, 'pending', notes || null]
        );

        if (newAppointmentResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res.status(500).json({ error: 'Failed to create appointment record.' });
        }
        const newAppointment = newAppointmentResult.rows[0];
        const appointmentId = newAppointment.id;
        const appointmentTimeFormatted = format(new Date(newAppointment.appointment_time), "MMM d, yyyy 'at' h:mm a");
        const serviceName = newAppointment.service_name;
        const clientName = newAppointment.client_name;
        const targetBarberName = newAppointment.target_barber_name; // Imię i nazwisko barbera

        // --- Tworzenie Powiadomień ---
        const clientNotificationTitle = "Booking Pending Confirmation";
        const clientMessage = `Your booking for ${serviceName} with ${targetBarberName} on ${appointmentTimeFormatted} is pending. We will notify you upon confirmation.`;

        const staffNotificationTitle = "New Booking Received";
        const staffMessage = `New booking from ${clientName} for ${serviceName} with ${targetBarberName} on ${appointmentTimeFormatted} (Appt ID: ${appointmentId}).`;

        // 1. Powiadomienie dla klienta (tabela user_notifications)
        await pgClient.query(
            `INSERT INTO user_notifications (user_id, title, message, link, type, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
            [clientUserId, clientNotificationTitle, clientMessage, `/user-dashboard/appointments`, 'booking_pending']
        );

        // 2. Powiadomienie dla barbera (tabela notifications, używając barberId z tabeli barbers)
        // Tabela 'notifications' używa 'barber_id' (ID z tabeli 'barbers')
        if (barberId) { // barberId to ID z tabeli barbers
            await pgClient.query(
                `INSERT INTO notifications (barber_id, title, message, link, type, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
                [barberId, staffNotificationTitle, staffMessage, `/barber-dashboard/schedule`, 'new_booking_barber']
            );
        }

        // 3. Powiadomienia dla adminów
        // Admini widzą wszystkie powiadomienia z tabeli notifications.
        // Nie tworzymy dla nich osobnych rekordów, jeśli mają dostęp do wszystkich powiadomień barberów.
        // Jeśli admini mieliby mieć osobne, dedykowane im rekordy, tabela 'notifications'
        // musiałaby zostać zmodyfikowana, np. przez dodanie kolumny 'recipient_user_id' (user_id admina)
        // i ustawienie 'barber_id' na NULL dla powiadomień czysto administracyjnych.
        // Na razie zakładamy, że admin przegląda powiadomienia barberów.
        // Jeśli chcesz DEDYKOWANE powiadomienie dla admina (np. o innej treści),
        // a tabela notifications ma tylko barber_id, to jest problematyczne.
        // Można by np. dodać powiadomienie z barber_id = NULL (jeśli dozwolone i masz taki "specjalny" barber_id dla adminów)
        // lub specjalnym typem, który admini obserwują.

        // Przykład: jeśli chciałbyś logować akcję dla admina w tej samej tabeli (z barber_id = NULL, jeśli schemat pozwala)
        // const adminUsersResult = await pgClient.query("SELECT id FROM users WHERE role = 'admin'");
        // for (const admin of adminUsersResult.rows) {
        //     // Tutaj musiałbyś zdecydować, jak zapisać to w tabeli notifications
        //     // Jeśli notifications ma TYLKO barber_id, nie zapiszesz tu user_id admina.
        //     // Można by np. stworzyć powiadomienie z barber_id = NULL i specjalnym typem.
        //     await pgClient.query(
        //         `INSERT INTO notifications (barber_id, title, message, link, type, is_read, created_at)
        //          VALUES (NULL, $1, $2, $3, $4, FALSE, NOW())`, // barber_id = NULL
        //         ["Admin Alert: New Booking", staffMessage, `/admin-dashboard/appointments`, 'new_booking_admin_alert']
        //     );
        // }
        // Powyższy blok dla adminów jest zakomentowany, ponieważ wymaga decyzji o schemacie tabeli notifications.

        await pgClient.query('COMMIT');
        res.status(201).json(newAppointment);

    } catch (err) {
        if (pgClient) {
            await pgClient.query('ROLLBACK');
        }
        console.error("Error in createBooking:", err.stack);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Invalid service or barber selected, or other relational issue.' });
        }
        res.status(500).json({ error: 'Server error creating booking. Check backend logs.' });
    } finally {
        if (pgClient) {
            pgClient.release();
        }
    }
};