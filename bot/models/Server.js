const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    icon: String,
    ownerId: {
        type: String,
        required: true
    },
    memberCount: {
        type: Number,
        default: 0
    },
    premium: {
        type: Boolean,
        default: false
    },
    needsBot: {
        type: Boolean,
        default: true
    },
    settings: {
        logChannel: String,
        moderatorRole: String,
        welcomeChannel: String,
        welcomeMessage: {
            type: String,
            default: 'Welcome {user} to {server}!'
        },
        enableLogging: { type: Boolean, default: false },
        enableWelcome: { type: Boolean, default: false },
        enableAutoRole: { type: Boolean, default: false },
        autoRole: String,
        prefix: { type: String, default: '!' }
    }
});

module.exports = mongoose.model('Server', serverSchema); 