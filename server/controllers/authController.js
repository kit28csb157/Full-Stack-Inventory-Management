/**
 * File: authController.js
 * Purpose: Handles authentication-related operations such as user registration, login, and fetching user lists.
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * The token expires in 30 days.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Registers a new user.
 * Validates if the user already exists, creates a new record, and returns a token upon success.
 */
const registerUser = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Check if a user with the given username already exists in the database
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Create the new user and save to database
        const user = await User.create({ username, password, role });
        
        // Respond with user data and auth token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Authenticates an existing user.
 * Verifies credentials and returns a token if successful.
 */
const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user by username
        const user = await User.findOne({ username });
        
        // Check if user exists and the provided password matches the hashed password
        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            // Send unauthorized status if credentials do not match
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieves a list of all users.
 * Passwords are excluded from the results for security.
 */
const getUsers = async (req, res) => {
    try {
        // Fetch all users and omit the password field
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { registerUser, loginUser, getUsers };
