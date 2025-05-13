const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Role = require('../models/role');

const MicrosoftLogin = async (req, res) => {
    try {
        const { firstName, lastName, email, phone_Number, avatar, role } = req.body;
        let user = await User.findOne({ email });
        let userRole;
        if (role) {
          userRole = await Role.findOne({ RoleName: role }); // Fetch role based on provided RoleName
        } else {
          userRole = await Role.findOne({ RoleName: 'Developer' }); // Default to 'Developer' role
        }

        if (!user) {
            const newUser = new User({ firstName, lastName, email, phone_Number, avatar, role:userRole._id});
            user = await newUser.save();
        }

        const token = jwt.sign(user.toObject(), process.env.JWT_SECRET);

        res.cookie('access_token', token, { httpOnly: true });
        res.status(200).json({
            success: true,
            message: 'User login successfully.',
            token, // Envoyez le token dans la réponse
            user
        });
    } catch (error) {
        console.error('Error in MicrosoftLogin:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error
        });
    }
};


const getUser = async (req, res) => {
    try {
        const token = req.cookies.access_token
        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Token not found.",
            })
        }

        const user = jwt.verify(token, process.env.JWT_SECRET)
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error
        })
    }
}

module.exports ={MicrosoftLogin, getUser}