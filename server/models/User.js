/**
 * File: User.js (Model)
 * Purpose: Mongoose schema definition for the User model. Includes methods for hashing passwords and verifying credentials.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for users
const userSchema = new mongoose.Schema({
    // Unique username for authentication
    username: { type: String, required: true, unique: true },
    // Hashed password
    password: { type: String, required: true },
    // User role determining access permissions (Admin or User)
    role: { type: String, enum: ['Admin', 'User'], default: 'User' }
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

/**
 * Pre-save middleware to hash the user's password before saving to the database.
 * This runs automatically whenever a new user is created or an existing password is changed.
 */
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare an entered plaintext password with the hashed password stored in the database.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
