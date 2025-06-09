const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
    guildId: String,
    messageId: String,
    channelId: String,
    reactions: [{
        emoji: String,
        roleId: String
    }]
});

module.exports = mongoose.model('ReactionRole', reactionRoleSchema); 