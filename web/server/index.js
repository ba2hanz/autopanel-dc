const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Create Express app
const app = express();

// CORS ayarları
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servers', require('./routes/servers'));
app.use('/api/premium', require('./routes/premium'));

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status
    });
    
    // Discord API hataları için özel mesaj
    if (err.response?.data?.message) {
        return res.status(err.response.status).json({
            message: 'Discord API Error',
            details: err.response.data
        });
    }

    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables loaded:', {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'Token exists' : 'Token missing',
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'Client ID exists' : 'Client ID missing',
        MONGODB_URI: process.env.MONGODB_URI ? 'MongoDB URI exists' : 'MongoDB URI missing'
    });
}); 