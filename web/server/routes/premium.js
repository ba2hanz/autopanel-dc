const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Server = require('../models/Server');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get premium status for a user
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            premium: user.premium,
            expiresAt: user.premiumExpiresAt
        });
    } catch (error) {
        console.error('Get premium status error:', error);
        res.status(500).json({ message: 'Error fetching premium status' });
    }
});

// Get premium status for a server
router.get('/server/:guildId', auth, async (req, res) => {
    try {
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Check if user has access to this server
        const user = await User.findById(req.user.id);
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            premium: server.premium,
            features: server.features
        });
    } catch (error) {
        console.error('Get server premium status error:', error);
        res.status(500).json({ message: 'Error fetching server premium status' });
    }
});

// Upgrade user to premium
router.post('/user/upgrade', auth, async (req, res) => {
    try {
        const { duration } = req.body; // Duration in months
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + duration);

        // Update user
        user.premium = true;
        user.premiumExpiresAt = expiresAt;
        await user.save();

        res.json({
            premium: true,
            expiresAt: user.premiumExpiresAt
        });
    } catch (error) {
        console.error('Upgrade user error:', error);
        res.status(500).json({ message: 'Error upgrading user' });
    }
});

// Upgrade server to premium
router.post('/server/:guildId/upgrade', auth, async (req, res) => {
    try {
        const { duration } = req.body; // Duration in months
        const server = await Server.findOne({ guildId: req.params.guildId });
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Check if user has access to this server
        const user = await User.findById(req.user.id);
        if (!user.servers.includes(server._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update server features
        server.premium = true;
        server.features = {
            maxAnnouncements: Infinity,
            maxGiveaways: Infinity,
            maxWordWatches: Infinity,
            maxTempRoles: Infinity,
            customEmbedColors: true,
            prioritySupport: true
        };
        await server.save();

        res.json({
            premium: true,
            features: server.features
        });
    } catch (error) {
        console.error('Upgrade server error:', error);
        res.status(500).json({ message: 'Error upgrading server' });
    }
});

// Check premium expiration
router.get('/check-expiration', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.premium && user.premiumExpiresAt) {
            const now = new Date();
            if (now > user.premiumExpiresAt) {
                // Premium expired
                user.premium = false;
                user.premiumExpiresAt = null;
                await user.save();

                // Update all user's servers to free tier
                const servers = await Server.find({ ownerId: user.discordId });
                for (const server of servers) {
                    server.premium = false;
                    server.features = {
                        maxAnnouncements: 1,
                        maxGiveaways: 0,
                        maxWordWatches: 0,
                        maxTempRoles: 0,
                        customEmbedColors: false,
                        prioritySupport: false
                    };
                    await server.save();
                }
            }
        }

        res.json({
            premium: user.premium,
            expiresAt: user.premiumExpiresAt
        });
    } catch (error) {
        console.error('Check expiration error:', error);
        res.status(500).json({ message: 'Error checking premium expiration' });
    }
});

module.exports = router; 