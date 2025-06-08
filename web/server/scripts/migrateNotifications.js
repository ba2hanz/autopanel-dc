const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function migrateNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Get all users
        const users = await User.find({});
        console.log(`Found ${users.length} users to migrate`);

        // Update each user's notifications settings
        for (const user of users) {
            try {
                // If notifications is a boolean, convert it to the new format
                if (typeof user.settings.notifications === 'boolean') {
                    const oldValue = user.settings.notifications;
                    user.settings.notifications = {
                        email: false,
                        discord: oldValue
                    };
                    await user.save();
                    console.log(`Updated user ${user.username} (${user._id})`);
                }
            } catch (err) {
                console.error(`Error updating user ${user._id}:`, err);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the migration
migrateNotifications(); 