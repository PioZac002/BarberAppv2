// backend/controllers/publicServicesController.js
const pool = require('../config/database');

exports.getAllPublicServices = async (req, res) => {
    try {
        // Pobieramy tylko aktywne usługi
        // Zgodnie ze schematem tabeli services, photo_url to adres obrazka
        const result = await pool.query(
            `SELECT id, name, description, price, duration, photo_url 
             FROM services 
             WHERE is_active = TRUE 
             ORDER BY name ASC`
        );

        const services = result.rows.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: parseFloat(service.price), // Upewnij się, że cena jest liczbą
            duration: parseInt(service.duration, 10),
            image: service.photo_url || null, // Mapujemy photo_url na image dla spójności z frontendem
            // Na razie usuwamy rating i category, bo nie ma ich w tabeli services
            // category: "all", // Można by dodać logikę kategoryzacji tutaj, jeśli potrzebne
            // rating: 0, // Placeholder, jeśli potrzebne
        }));

        res.json(services);
    } catch (err) {
        console.error("Error in getAllPublicServices:", err.stack);
        res.status(500).json({ error: 'Server error fetching services.' });
    }
};