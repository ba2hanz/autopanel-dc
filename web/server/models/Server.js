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
    features: {
        maxAnnouncements: {
            type: Number,
            default: 1
        },
        maxGiveaways: {
            type: Number,
            default: 0
        },
        maxWordWatches: {
            type: Number,
            default: 0
        },
        maxTempRoles: {
            type: Number,
            default: 0
        },
        customEmbedColors: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        }
    },
    usage: {
        announcements: {
            type: Number,
            default: 0
        },
        giveaways: {
            type: Number,
            default: 0
        },
        wordWatches: {
            type: Number,
            default: 0
        },
        tempRoles: {
            type: Number,
            default: 0
        }
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updatedAt timestamp before saving
serverSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Server', serverSchema); 