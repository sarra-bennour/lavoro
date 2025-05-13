// controllers/authController.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

const googleLogin = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ success: false, message: "Missing OAuth code" });
        }

        const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const userInfo = await oauth2Client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });

        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: image, phone_number: phone_number, role} = userInfo.data;

        let user = await User.findOne({ provider_id: googleId });


              let userRole;
              if (role) {
                userRole = await Role.findOne({ RoleName: role }); // Fetch role based on provided RoleName
              } else {
                userRole = await Role.findOne({ RoleName: 'Developer' }); // Default to 'Developer' role
              }

        if (!user) {
            user = await User.create({
                provider_id: googleId,
                provider: 'Google',
                firstName,
                lastName,
                email,
                image,
                phone_number,
                role:userRole._id
            });
        }

        const token = jwt.sign(
            { _id: user._id, email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: "Welcome to Lavoro",
            token,
            user: {
                _id: user._id,
                firstName,
                lastName,
                email,
                image,
                phone_number,
            },
        });
    } catch (err) {
        console.error("Google Authentication Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = { googleLogin };