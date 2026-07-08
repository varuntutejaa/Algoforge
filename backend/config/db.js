// MongoDB connection setup with retry + logging.
const mongoose = require('mongoose');
const { migratePythonBoilerplates } = require('../services/problems');

const mongooseOptions = {
    // Short server selection timeout so failures are surfaced quickly
    serverSelectionTimeoutMS: 5000
};

async function connectWithRetry(retries = 5, delayMs = 3000) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not set in environment. Set MONGO_URI to your MongoDB connection string.');
        process.exit(1);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri, mongooseOptions);
            console.log('MongoDB Connected');
            migratePythonBoilerplates();
            return;
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) {
                console.log(`Retrying in ${delayMs}ms...`);
                await new Promise((r) => setTimeout(r, delayMs));
            } else {
                console.error('All MongoDB connection attempts failed.');
                console.error(err);
                process.exit(1);
            }
        }
    }
}

mongoose.connection.on('connected', () => console.log('Mongoose connection: connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose connection: disconnected'));

module.exports = { connectWithRetry };
