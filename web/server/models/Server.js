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
        prefix: { type: String, default: '!' },
        enableLogging: { type: Boolean, default: false },
        logChannel: { type: String, default: '' },
        enableWelcome: { type: Boolean, default: false },
        welcomeChannel: { type: String, default: '' },
        welcomeMessage: { type: String, default: 'Welcome {user} to {server}!' },
        enableAutoRole: { type: Boolean, default: false },
        autoRole: { type: String, default: '' },
        moderatorRoles: { type: [String], default: [] },
        // Otomatik Moderasyon Ayarları
        enableBadwordsFilter: { type: Boolean, default: false },
        enableSpamFilter: { type: Boolean, default: false },
        enableLinkFilter: { type: Boolean, default: false },
        enableFloodFilter: { type: Boolean, default: false },
        enableCapsFilter: { type: Boolean, default: false },
        badwordsList: { type: [String], default: [] },
        badwordsPunishment: { type: String, enum: ['warn', 'delete_warn', 'timeout', 'kick', 'ban'], default: 'delete_warn' },
        spamPunishment: { type: String, enum: ['warn', 'delete_warn', 'timeout', 'kick', 'ban'], default: 'delete_warn' },
        linkPunishment: { type: String, enum: ['warn', 'delete_warn', 'timeout', 'kick', 'ban'], default: 'delete_warn' },
        capsPunishment: { type: String, enum: ['warn', 'delete_warn', 'timeout', 'kick', 'ban'], default: 'delete_warn' },
        floodPunishment: { type: String, enum: ['warn', 'delete_warn', 'timeout', 'kick', 'ban'], default: 'delete_warn' },
        linkIgnoredChannels: { type: [String], default: [] },
        linkIgnoredRoles: { type: [String], default: [] },
        badwordsIgnoredChannels: { type: [String], default: [] },
        badwordsIgnoredRoles: { type: [String], default: [] },
        capsIgnoredChannels: { type: [String], default: [] },
        capsIgnoredRoles: { type: [String], default: [] },
        floodIgnoredChannels: { type: [String], default: [] },
        floodIgnoredRoles: { type: [String], default: [] },
        spamIgnoredChannels: { type: [String], default: [] },
        spamIgnoredRoles: { type: [String], default: [] },
        warningSystem: {
            enabled: { type: Boolean, default: false },
            punishments: [{
                warnings: { type: Number, required: true },
                punishment: { type: String, enum: ['timeout', 'kick', 'ban'], required: true },
                duration: { type: Number } // timeout süresi için (milisaniye)
            }],
            warningExpiry: { type: Number, default: 86400000 } // 24 saat
        }
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