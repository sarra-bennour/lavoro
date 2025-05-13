const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password_hash');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = user; // Attach user to request
        next(); // Proceed to the next middleware/controller
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authenticateUser;