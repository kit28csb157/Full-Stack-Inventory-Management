/**
 * File: server.js
 * Purpose: Entry point for the Node.js Express server. Configures middleware, connects to MongoDB, and defines API routes.
 */

// Load environment variables from .env file
require('dotenv').config();

// Import required core modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route definitions
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Initialize the Express application
const app = express();

// Apply global middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON payloads

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Define the port for the server to listen on, defaulting to 5000
const PORT = process.env.PORT || 5000;

// Connect to the MongoDB database using Mongoose
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('Connected to MongoDB');
    // Start the server only after successful database connection
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    // Log any connection errors
    console.error('MongoDB connection error:', error);
});
