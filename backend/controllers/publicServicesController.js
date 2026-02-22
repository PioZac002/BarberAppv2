// backend/controllers/publicServicesController.js
const pool = require('../config/database');

exports.getAllPublicServices = async (req, res) => {
    try {
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
            price: parseFloat(service.price),
            duration: parseInt(service.duration, 10),
            image: service.photo_url || null,
        }));

        res.json(services);
    } catch (err) {
        console.error("Error in getAllPublicServices:", err.stack);
        res.status(500).json({ error: 'Server error fetching services.' });
    }
};
