const pool = require('../config/database');

// Pobiera listę barberów z podstawowymi informacjami
exports.getAllBarberSummaries = async (req, res) => {
    try {
        // Zakładamy, że aktywni barberzy mają np. status 'active' lub są po prostu wszyscy w tabeli
        // Dodaj odpowiedni warunek WHERE jeśli masz taki status
        const query = `
            SELECT 
                b.id, 
                u.first_name, 
                u.last_name,
                b.job_title,       -- Nowa kolumna dla roli/tytułu
                b.experience,      -- Nowa/zaktualizowana kolumna
                b.specialties,     -- Istniejąca kolumna TEXT[]
                b.profile_image_url AS image, -- Nowa kolumna dla zdjęcia profilowego
                COALESCE(avg_reviews.rating, 0) AS rating
            FROM barbers b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating), 1) AS rating 
                FROM reviews 
                GROUP BY barber_id
            ) AS avg_reviews ON b.id = avg_reviews.barber_id
            -- WHERE b.is_active = TRUE -- Opcjonalny warunek, jeśli masz status aktywności
            ORDER BY u.first_name, u.last_name;
        `;
        const result = await pool.query(query);

        const barbers = result.rows.map(barber => ({
            id: barber.id,
            name: `${barber.first_name} ${barber.last_name}`,
            role: barber.job_title || 'Barber', // Domyślna rola jeśli brak
            rating: parseFloat(barber.rating) || 0,
            experience: parseInt(barber.experience, 10) || 0,
            specializations: barber.specialties || [], // Powinno być już tablicą z TEXT[]
            image: barber.image || 'https://via.placeholder.com/300/CCCCCC/808080?Text=No+Image', // Placeholder
        }));

        res.json(barbers);
    } catch (err) {
        console.error("Error in getAllBarberSummaries:", err.stack);
        res.status(500).json({ error: 'Server error fetching barber summaries' });
    }
};
exports.getAllPublicReviews = async (req, res) => {
    try {
        // Zapytanie JOIN do pobrania potrzebnych informacji
        // Zakładamy, że chcemy wyświetlić imię autora (klienta), nazwę usługi i imię barbera.
        // authorImage, helpful, unhelpful - na razie pomijamy, bo nie ma ich bezpośrednio w bazie.
        const query = `
            SELECT 
                r.id, 
                r.rating, 
                r.comment, 
                r.created_at AS date, 
                (u_client.first_name || ' ' || u_client.last_name) AS author,
                s.name AS service_name,
                (u_barber.first_name || ' ' || u_barber.last_name) AS barber_name
                -- Można dodać u_client.profile_image_url AS author_image, jeśli istnieje w tabeli users
            FROM reviews r
            JOIN users u_client ON r.client_id = u_client.id
            JOIN appointments a ON r.appointment_id = a.id
            JOIN services s ON a.service_id = s.id
            JOIN barbers b ON r.barber_id = b.id
            JOIN users u_barber ON b.user_id = u_barber.id
            ORDER BY r.created_at DESC; 
            -- Można dodać LIMIT np. LIMIT 50, jeśli recenzji jest bardzo dużo
        `;
        const result = await pool.query(query);

        const reviews = result.rows.map(review => ({
            id: review.id,
            rating: parseInt(review.rating, 10),
            comment: review.comment,
            date: review.date, // Formatowanie daty lepiej zrobić na frontendzie
            author: review.author,
            // authorImage: review.author_image || 'URL_DO_DOMYSLNEGO_AWATARA', // Jeśli dodasz
            service: review.service_name,
            barber: review.barber_name,
            helpful: 0, // Placeholder
            unhelpful: 0, // Placeholder
        }));

        res.json(reviews);
    } catch (err) {
        console.error("Error in getAllPublicReviews:", err.stack);
        res.status(500).json({ error: 'Server error fetching public reviews.' });
    }
};
// Pobiera szczegółowe informacje o konkretnym barberze
exports.getBarberDetailsById = async (req, res) => {
    const { barberId } = req.params;
    try {
        const barberQuery = `
            SELECT 
                b.id, 
                u.first_name, 
                u.last_name,
                b.job_title,
                b.experience,
                b.specialties,
                b.profile_image_url AS image,
                b.email,          -- Publiczny email z tabeli barbers
                b.phone,          -- Publiczny telefon z tabeli barbers
                b.bio,
                b.certifications, -- Nowa kolumna TEXT[]
                COALESCE(avg_reviews.rating, 0) AS rating
            FROM barbers b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN (
                SELECT barber_id, ROUND(AVG(rating), 1) AS rating 
                FROM reviews 
                GROUP BY barber_id
            ) AS avg_reviews ON b.id = avg_reviews.barber_id
            WHERE b.id = $1;
        `;
        const barberResult = await pool.query(barberQuery, [barberId]);

        if (barberResult.rows.length === 0) {
            return res.status(404).json({ error: 'Barber not found' });
        }

        const barberData = barberResult.rows[0];

        // Pobierz zdjęcia portfolio
        const portfolioResult = await pool.query(
            'SELECT image_url FROM portfolio_images WHERE barber_id = $1 ORDER BY created_at DESC',
            [barberId]
        );
        const portfolioImages = portfolioResult.rows.map(img => img.image_url);

        const responseData = {
            id: barberData.id,
            name: `${barberData.first_name} ${barberData.last_name}`,
            role: barberData.job_title || 'Barber',
            rating: parseFloat(barberData.rating) || 0,
            experience: parseInt(barberData.experience, 10) || 0,
            specializations: barberData.specialties || [],
            email: barberData.email,
            phone: barberData.phone,
            bio: barberData.bio,
            certifications: barberData.certifications || [],
            portfolioImages: portfolioImages,
            image: barberData.image || 'https://via.placeholder.com/400/CCCCCC/808080?Text=No+Profile+Image',
        };

        res.json(responseData);
    } catch (err) {
        console.error("Error in getBarberDetailsById:", err.stack);
        res.status(500).json({ error: 'Server error fetching barber details' });
    }
};