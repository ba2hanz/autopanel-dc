const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware
app.use((req, res, next) => {
    console.log('\n=== Yeni İstek ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Mount routes
console.log('\n=== Route\'lar Yükleniyor ===');
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
console.log('✅ Route\'lar yüklendi');

// 404 handler
app.use((req, res) => {
    console.log('\n❌ Route bulunamadı:', req.method, req.path);
    res.status(404).json({ 
        message: 'Route bulunamadı',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB bağlantısı başarılı');
        
        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
            console.log('📝 Yüklenen route\'lar:');
            console.log('- /api/auth/*');
            console.log('- /api/servers/*');
        });
    })
    .catch(err => {
        console.error('❌ MongoDB bağlantı hatası:', err);
        process.exit(1);
    });

module.exports = app; 