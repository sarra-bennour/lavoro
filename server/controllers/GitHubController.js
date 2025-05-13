
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const GitHubLogin = async (req, res)=>{
    try {
        const { firstName, lastName, email, phone_Number, avatar } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
            const newUser = new User({
                 firstName, lastName, email, phone_Number, avatar 
                });
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
        console.error('Error in GitHubLogin:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error
        });
    }
};


const getData = async (req, res) => {
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

module.exports={GitHubLogin, getData}