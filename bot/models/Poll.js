const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    duration: {
        type: Number,
        required: true,
        default: 24 // Default 24 hours
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    endsAt: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
});

// Create compound index for guildId and messageId
pollSchema.index({ guildId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('Poll', pollSchema); 