const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const barberRoutes = require('./routes/BarberRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const publicTeamRoutes = require('./routes/publicTeamRoutes');
const publicServicesRoutes = require('./routes/publicServicesRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const corsOptions = {
    origin:'http://localhost:5174', // Adres frontendu na localhost
        //'https://barberappv2.onrender.com', // Adres frontendu
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

//app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/barber', barberRoutes);
app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/public/team', publicTeamRoutes);
app.use('/api/public/services', publicServicesRoutes);

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});

