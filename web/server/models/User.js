const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    email: {
        type: String
    },
    servers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server'
    }],
    settings: {
        notifications: {
            email: {
                type: Boolean,
                default: false
            },
            discord: {
                type: Boolean,
                default: true
            }
        },
        darkMode: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'tr'
        },
        twoFactor: {
            type: Boolean,
            default: false
        }
    },
    premium: {
        type: Boolean,
        default: false
    },
    premiumExpiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema); 