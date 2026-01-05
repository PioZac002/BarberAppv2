const pool = require('../config/database');
const { parse, format, addMinutes, isValid: isValidDateFn } = require('date-fns');

// Funkcja generateTimeSlots
const generateTimeSlots = (startTimeStr, endTimeStr, slotIntervalMinutes, serviceDurationMinutes) => {
    const slots = [];
    if (
        !startTimeStr ||
        !endTimeStr ||
        !/^\d{2}:\d{2}$/.test(startTimeStr) ||
        !/^\d{2}:\d{2}$/.test(endTimeStr)
    ) {
        console.error(
            'Invalid start or end time string for generateTimeSlots:',
            startTimeStr,
            endTimeStr
        );
        return [];
    }
    try {
        let currentTime = parse(startTimeStr, 'HH:mm', new Date());
        const endTime = parse(endTimeStr, 'HH:mm', new Date());
        while (currentTime < endTime) {
            const slotEndTime = addMinutes(currentTime, serviceDurationMinutes);
            if (slotEndTime > endTime) break;
            slots.push(format(currentTime, 'HH:mm'));
            currentTime = addMinutes(currentTime, slotIntervalMinutes);
        }
    } catch (error) {
        console.error('Error generating time slots:', error);
        return [];
    }
    return slots;
};

// getServicesForBooking
const getServicesForBooking = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, duration, price, photo_url AS image FROM services WHERE is_active = TRUE ORDER BY name'
        );
        res.json(result.rows.map(s => ({ ...s, price: parseFloat(s.price) })));
    } catch (err) {
        console.error('Error in getServicesForBooking:', err.stack);
        res
            .status(500)
            .json({ error: 'Błąd serwera podczas pobierania usług. Sprawdź logi backendu.' });
    }
};

// getBarbersForBooking
const getBarbersForBooking = async (req, res) => {
    try {
        const query = `
            SELECT 
                b.id, u.first_name, u.last_name,
                COALESCE(b.job_title, 'Barber') AS role,
                COALESCE(b.profile_image_url, 'https://via.placeholder.com/150/CCCCCC/808080?Text=No+Image') AS image,
                b.experience AS experience_text, 
                COALESCE(br.avg_rating, 0.0) AS rating
            FROM barbers b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating),1) as avg_rating FROM reviews GROUP BY barber_id
            ) br ON br.barber_id = b.id
            ORDER BY u.first_name, u.last_name;`;
        const result = await pool.query(query);
        res.json(
            result.rows.map(b_row => ({
                id: b_row.id,
                name: `${b_row.first_name} ${b_row.last_name}`,
                role: b_row.role,
                rating: parseFloat(b_row.rating) || 0,
                experience: parseInt(b_row.experience_text, 10) || 0,
                image: b_row.image,
            }))
        );
    } catch (err) {
        console.error('Error in getBarbersForBooking:', err.stack);
        res
            .status(500)
            .json({ error: 'Błąd serwera podczas pobierania barberów. Sprawdź logi backendu.' });
    }
};

// getAvailableTimeSlots
const getAvailableTimeSlots = async (req, res) => {
    const { date, serviceId, barberId } = req.query;
    if (!date || !serviceId || !barberId) {
        return res
            .status(400)
            .json({ error: 'Data, identyfikator usługi i barbera są wymagane.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
            .status(400)
            .json({ error: 'Nieprawidłowy format daty. Użyj formatu RRRR-MM-DD.' });
    }

    try {
        const serviceResult = await pool.query(
            'SELECT duration FROM services WHERE id = $1 AND is_active = TRUE',
            [serviceId]
        );
        if (serviceResult.rows.length === 0) {
            return res
                .status(404)
                .json({ error: 'Usługa nie istnieje lub jest nieaktywna.' });
        }
        const serviceDurationMinutes = parseInt(serviceResult.rows[0].duration, 10);

        const barberWorkingHoursResult = await pool.query(
            'SELECT working_hours FROM barbers WHERE id = $1',
            [barberId]
        );
        let workStartStr = '09:00',
            workEndStr = '17:00';
        if (
            barberWorkingHoursResult.rows.length > 0 &&
            barberWorkingHoursResult.rows[0].working_hours
        ) {
            const parts = barberWorkingHoursResult.rows[0].working_hours.split('-');
            if (
                parts.length === 2 &&
                /^\d{2}:\d{2}$/.test(parts[0]) &&
                /^\d{2}:\d{2}$/.test(parts[1])
            ) {
                [workStartStr, workEndStr] = parts;
            } else {
                console.warn(
                    `Invalid working_hours for barber ${barberId}. Using default.`
                );
            }
        } else {
            console.warn(`Working hours not set for barber ${barberId}. Using default.`);
        }

        const slotIntervalMinutes = 30;
        const allPossibleSlots = generateTimeSlots(
            workStartStr,
            workEndStr,
            slotIntervalMinutes,
            serviceDurationMinutes
        );

        const appointmentsResult = await pool.query(
            `SELECT appointment_time, (SELECT duration FROM services s_apt WHERE s_apt.id = a.service_id) as duration 
             FROM appointments a 
             WHERE barber_id = $1 
               AND DATE(appointment_time AT TIME ZONE 'UTC') = $2 
               AND status NOT IN ('canceled', 'cancelled', 'no-show')`,
            [barberId, date]
        );

        const bookedSlots = appointmentsResult.rows.map(apt => {
            const startTime = parse(
                format(new Date(apt.appointment_time), 'HH:mm'),
                'HH:mm',
                new Date(date)
            );
            return {
                start: startTime,
                end: addMinutes(startTime, parseInt(apt.duration, 10)),
            };
        });

        const availableSlots = allPossibleSlots.filter(slotStr => {
            const slotStartDateTime = parse(slotStr, 'HH:mm', new Date(date));
            const slotEndDateTime = addMinutes(slotStartDateTime, serviceDurationMinutes);
            return !bookedSlots.some(
                bs => slotStartDateTime < bs.end && slotEndDateTime > bs.start
            );
        });

        res.json(
            availableSlots.map(slot =>
                format(parse(slot, 'HH:mm', new Date()), 'h:mm a')
            )
        );
    } catch (err) {
        console.error('Error in getAvailableTimeSlots:', err.stack);
        res.status(500).json({
            error:
                'Błąd serwera podczas pobierania dostępnych godzin. Sprawdź logi backendu.',
        });
    }
};

// Tworzenie rezerwacji z powiadomieniami
const createBooking = async (req, res) => {
    const clientUserId = req.user.id;
    const { serviceId, barberId, date, timeSlot, notes } = req.body;

    if (!serviceId || !barberId || !date || !timeSlot) {
        return res.status(400).json({
            error: 'Usługa, barber, data i godzina wizyty są wymagane.',
        });
    }

    let pgClient;
    try {
        pgClient = await pool.connect();
        await pgClient.query('BEGIN');

        const parsedTime = parse(timeSlot, 'h:mm a', new Date());
        const datePart = date.split('T')[0];
        const localDateTime = new Date(
            `${datePart}T${format(parsedTime, 'HH:mm:ss')}`
        );

        if (!isValidDateFn(localDateTime)) {
            await pgClient.query('ROLLBACK');
            return res
                .status(400)
                .json({ error: 'Podano nieprawidłowy format daty lub godziny.' });
        }

        const appointmentInsertQuery = `
            INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, appointment_time,
                      (SELECT name FROM services WHERE id = $3) AS service_name,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = $1) as client_name,
                      (SELECT user_id FROM barbers WHERE id = $2) as target_barber_user_id,
                      (SELECT first_name || ' ' || last_name FROM users WHERE id = (SELECT user_id FROM barbers WHERE id = $2)) as target_barber_name;
        `;
        const newAppointmentResult = await pgClient.query(appointmentInsertQuery, [
            clientUserId,
            barberId,
            serviceId,
            localDateTime,
            'pending',
            notes || null,
        ]);

        if (newAppointmentResult.rows.length === 0) {
            await pgClient.query('ROLLBACK');
            return res
                .status(500)
                .json({ error: 'Nie udało się utworzyć rekordu wizyty.' });
        }

        const newAppointment = newAppointmentResult.rows[0];
        const appointmentId = newAppointment.id;
        const appointmentTimeFormatted = format(
            new Date(newAppointment.appointment_time),
            "MMM d, yyyy 'at' h:mm a"
        );
        const serviceName = newAppointment.service_name;
        const clientName = newAppointment.client_name;
        const targetBarberName = newAppointment.target_barber_name;
        const targetBarberUserId = newAppointment.target_barber_user_id;

        // Powiadomienie dla klienta
        const clientNotificationTitle = 'Rezerwacja oczekuje na potwierdzenie';
        const clientMessage = `Twoja rezerwacja na usługę ${serviceName} u ${targetBarberName} w dniu ${appointmentTimeFormatted} oczekuje na potwierdzenie. Powiadomimy Cię, gdy zostanie potwierdzona.`;
        await pgClient.query(
            `INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
            [
                clientUserId,
                'booking_pending',
                clientNotificationTitle,
                clientMessage,
                `/user-dashboard/appointments`,
            ]
        );

        // Powiadomienie dla barbera
        const barberNotificationTitle = 'Nowa rezerwacja';
        const barberMessageForBarber = `Nowa rezerwacja od ${clientName} na usługę ${serviceName} w dniu ${appointmentTimeFormatted} (ID wizyty: ${appointmentId}).`;
        if (barberId) {
            await pgClient.query(
                `INSERT INTO notifications (barber_id, recipient_user_id, type, title, message, link, is_read, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())`,
                [
                    barberId,
                    targetBarberUserId,
                    'new_booking_barber',
                    barberNotificationTitle,
                    barberMessageForBarber,
                    `/barber-dashboard/schedule`,
                ]
            );
        }

        // Powiadomienia dla administratorów
        const adminNotificationTitle = 'Nowa wizyta została zarezerwowana';
        const adminMessageForAdmin = `Nowa wizyta (ID: ${appointmentId}) została zarezerwowana przez ${clientName} u ${targetBarberName} na usługę ${serviceName} w dniu ${appointmentTimeFormatted}.`;
        const adminLink = `/admin-dashboard/appointments?appointmentId=${appointmentId}`;

        const adminUsersResult = await pgClient.query(
            "SELECT id FROM users WHERE role = 'admin'"
        );
        if (adminUsersResult.rows.length > 0) {
            const adminNotificationQuery = `
                INSERT INTO admin_notifications (admin_user_id, type, title, message, link, 
                                                related_appointment_id, related_client_id, related_barber_id, 
                                                is_read, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW());
            `;
            for (const admin of adminUsersResult.rows) {
                try {
                    await pgClient.query(adminNotificationQuery, [
                        admin.id,
                        'new_appointment_booked',
                        adminNotificationTitle,
                        adminMessageForAdmin,
                        adminLink,
                        appointmentId,
                        clientUserId,
                        barberId,
                    ]);
                } catch (adminNotifError) {
                    console.error(
                        `Failed to send notification to admin ${admin.id}:`,
                        adminNotifError.message
                    );
                }
            }
        }

        await pgClient.query('COMMIT');
        res.status(201).json({
            id: newAppointment.id,
            appointment_time: newAppointment.appointment_time,
            service_name: serviceName,
            client_name: clientName,
            barber_name: targetBarberName,
            status: 'pending',
        });
    } catch (err) {
        if (pgClient) {
            await pgClient.query('ROLLBACK');
        }
        console.error('Error in createBooking:', err.stack);
        if (err.code === '23503') {
            return res.status(400).json({
                error:
                    'Wybrano nieprawidłową usługę lub barbera albo wystąpił inny błąd powiązań w bazie.',
            });
        }
        if (err.code === '23505') {
            return res.status(400).json({
                error: `Błąd zduplikowanego klucza: ${
                    err.detail || err.message
                }`,
            });
        }
        res.status(500).json({
            error:
                'Błąd serwera podczas tworzenia rezerwacji. Sprawdź logi backendu.',
        });
    } finally {
        if (pgClient) {
            pgClient.release();
        }
    }
};

// Eksport funkcji dla routera
module.exports = {
    getServicesForBooking,
    getBarbersForBooking,
    getAvailableTimeSlots,
    createBooking,
};
