/**
 * File: auth.js (middleware)
 * Purpose: Provides middleware functions to protect routes by verifying JSON Web Tokens (JWT)
 *          and checking user roles for authorization.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware:
 * Ensures the user is authenticated by verifying their JWT.
 * It attaches the authenticated user object to `req.user` if successful.
 */
const protect = async (req, res, next) => {
    let token;
    // Check if the authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token string from the header
            token = req.headers.authorization.split(' ')[1];
            // Decode and verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Find the user by the decoded ID and omit the password field
            req.user = await User.findById(decoded.id).select('-password');
            return next(); // Proceed to the next middleware or route handler
        } catch (error) {
            // Token is invalid or expired
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // No token provided in the request headers
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Admin middleware:
 * Checks if the currently authenticated user has the 'Admin' role.
 * Must be used after the `protect` middleware.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next(); // User is an admin, proceed to the next handler
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
