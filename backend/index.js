const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const barberRoutes = require('./routes/barberRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/barber', barberRoutes);
app.use('/api/user', userRoutes);

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});