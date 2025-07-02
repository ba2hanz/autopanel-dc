const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
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
    message: {
        type: String,
        required: true
    },
    reactions: [{
        emoji: {
            type: String,
            required: true
        },
        roleId: {
            type: String,
            required: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
});

// Create compound index for guildId and messageId
reactionRoleSchema.index({ guildId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('ReactionRole', reactionRoleSchema); 