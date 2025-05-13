
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

const { validatePassword ,validateUserInput } = require('../middleware/validate'); // Import the validation function
const transporter = require('../utils/emailConfig'); // Import the email transporter
const AccountActivityLog = require('../models/accountActivityLog');
const Role = require('../models/role');

const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');



// Function to generate a dynamic avatar
const generateAvatar = (firstName, lastName) => {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Set background color
  ctx.fillStyle = '#FF416C'; // Green background
  ctx.fillRect(0, 0, 200, 200);

  // Set text properties
  ctx.font = 'bold 80px Arial';
  ctx.fillStyle = '#FFFFFF'; // White text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw initials
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  ctx.fillText(initials, 100, 100);

  // Save the avatar to the imagesAvatar folder
  const avatarPath = path.join(__dirname, '../public/imagesAvatar', `${Date.now()}-avatar.png`);
  const out = fs.createWriteStream(avatarPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return `/imagesAvatar/${path.basename(avatarPath)}`;
};



exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate('role', 'RoleName')
      .select('email firstName lastName role')
      .lean();

    const nonAdminUsers = users.filter(user => {
      const roleName = (user.role?.RoleName || '').trim().toLowerCase();
      return roleName !== 'admin';
    });

    res.status(200).json({
      success: true,
      data: nonAdminUsers
    });

    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





exports.signup = async (req, res) => {
  try {
      const { firstName, lastName, email, password, role, phone_number } = req.body;


      // Validate user input
      const validationError = validateUserInput({ firstName, lastName, phoneNumber: phone_number, password });
      if (validationError) {
          return res.status(400).json({ error: validationError });
      }

      // Hash the password
      const password_hash = await bcrypt.hash(password, 10);

      // Handle image upload or generate avatar
      let imagePath;
      if (req.file) {
          imagePath = `/imagesUser/${req.file.filename}`;
      } else {
          imagePath = generateAvatar(firstName, lastName);
      }

      console.log("Image path:", imagePath);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          console.log("Invalid email format:", email);
          return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          console.log("Email already exists:", email);
          return res.status(400).json({ error: 'This email is already in use.' });
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
          return res.status(400).json({ error: passwordError });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');

      let userRole;
      if (role) {
          userRole = await Role.findOne({ RoleName: role }); // Fetch role based on provided RoleName
      } else {
          userRole = await Role.findOne({ RoleName: 'Developer' }); // Default to 'Developer' role
      }


      // Create new user
      const user = new User({
          firstName,
          lastName,
          email,
          password_hash,
          role: userRole._id,
          phone_number,
          image: imagePath,
          verificationToken, // Save the verification token
          isVerified: false,
      });

      // Save the user to the database
      await user.save();


      // Send verification email
      const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
      const mailOptions = {
        to: email,
        from: `LAVORO <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333;">Welcome to LAVORO!</h2>
            <p style="font-size: 16px; line-height: 1.5;">
              Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; font-weight: bold;
                        display: inline-block;">
                Verify Your Email 
              </a>
            </div>
            
            
            <p style="font-size: 14px; color: #666;">
              This link will expire in 24 hours for security reasons.
            </p>


                <p style="font-size: 14px; color: #666;">
Best Regard , ${lastName} ${firstName}       </p>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <img src="https://res.cloudinary.com/dh6l1swhr/image/upload/v1744759769/487972506_1688041379262753_7417474063211568728_n_ooxbbd.png" alt="LAVORO Logo" style="max-width: 200px; max-height: 150px;">
              <p style="font-size: 12px; color: #999; margin-top: 10px;">
                © ${new Date().getFullYear()} LAVORO. All rights reserved.
              </p>
            </div>
          </div>
        `,

        // Keep text version for email clients that don't support HTML
        text: `Welcome to LAVORO!\n\nPlease verify your email by clicking the following link:\n${verificationUrl}\n\nIf you didn't create an account with LAVORO, you can safely ignore this email.`
      };

      await transporter.sendMail(mailOptions);


      res.status(201).json({ message: '✅ User registered successfully. Please check your email for verification.' });

  } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).json({ error: 'An error occurred during signup. Please try again.' });
  }
};





const MAX_ATTEMPTS = 3; // Nombre max de tentatives
const LOCK_TIME = 5 * 60 * 1000; // 5 minutes en millisecondes


exports.signin = async (req, res) => {
  try {
      const { email, password } = req.body;
      console.log('Sign-in attempt for email:', email);

      // Find the user by email
      const user = await User.findOne({ email }).populate('role');
      if (!user) {
          console.log('User not found for email:', email);
          return res.status(400).json({ error: 'User not found.' });
      }

      console.log('User found:', user.email);

         // Vérifier si le compte est verrouillé
  // Vérifier si le compte est verrouillé
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000); // en minutes
    return res.status(403).json({
        error: `Votre compte est bloqué pour ${remainingTime} minutes. Il sera réactivé à ${new Date(user.lockUntil).toLocaleTimeString()}.`,
        lockMessage: `Votre compte est verrouillé jusqu'à ${new Date(user.lockUntil).toLocaleTimeString()}.`
    });
}

      // Check if the user is verified
      if (!user.isVerified) {
          console.log('User not verified:', email);
          return res.status(400).json({ error: 'Please verify your email before signing in.' });
      }

      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
          user.loginAttempts += 1;

          if (user.loginAttempts >= MAX_ATTEMPTS) {
            user.lockUntil = Date.now() + LOCK_TIME;

            // Envoyer un e-mail à l'utilisateur
            const emailSubject = 'Votre compte est verrouillé';
            const emailText = `  Hello ${user.firstName},

            Your account has been locked for 5 minutes due to multiple failed login attempts.
           Please try again later

            Best regards,
            The Lavoro Team`;
            await sendEmail(user.email, emailSubject, emailText);
          }


          await user.save();
          return res.status(400).render('signin', { error: 'Mot de passe invalide.', email });
        }


  user.loginAttempts = 0;
  user.lockUntil = null;
  user.last_activity = Date.now();
  await user.save();




      console.log('Sign-in successful for email:', email);

      user.last_activity = Date.now();
      await user.save();

      // Set the user session
      req.session.user = user;


      console.log('Session created for user:', req.session.user);
      await AccountActivityLog.create({
          userId: user._id,
          action: 'User Logged In',
        });

        if (user.twoFactorEnabled) {
          return res.status(200).json({ requires2FA: true, userId: user._id });
        }


      // Generate a token with 7-day expiration
      const token = jwt.sign(
        { _id: user._id }, // Payload
        process.env.JWT_SECRET, // Secret key
        { expiresIn: '7d' } // Expires in 7 days
    );

    // Return user data and token
    res.status(200).json({
        user,
        token
    });



  } catch (error) {
      console.error('Error during sign-in:', error);
      res.status(500).json({ error: 'An error occurred during sign-in. Please try again.' });
  }

};
exports.verify2FALogin = async (req, res) => {
  try {
      const { userId, token } = req.body;

      if (!userId || !token) {
          return res.status(400).json({ error: 'User ID and token are required' });
      }

      const user = await User.findById(userId);

      if (!user || !user.twoFactorSecret) {
          return res.status(400).json({ error: '2FA not enabled for this user' });
      }

      // Verify the TOTP code
      const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token,
          window: 1, // Allow a 1-step window for time drift
      });

      if (verified) {
          // Generate a token with 7-day expiration
          const token = jwt.sign(
              { _id: user._id }, // Payload
              process.env.JWT_SECRET, // Secret key
              { expiresIn: '7d' } // Expires in 7 days
          );

          // Return user data and token
          res.status(200).json({ user, token });
      } else {
          res.status(400).json({ error: 'Invalid 2FA code' });
      }
  } catch (error) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        console.log('Verification token received:', token);

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            console.log('User not found for token:', token);
            return res.status(400).json({ error: 'Invalid or expired token.' });
        }

        if (user.isVerified) {
            console.log('User is already verified:', user.email);
            return res.status(200).json({ message: 'Email is already verified.' });
        }

        // Only delete the token *after* a successful response
        user.isVerified = true;
        await user.save();

        console.log('User verified successfully:', user.email);
        res.status(200).json({ message: ' ✅ Email verified successfully!' });

        // Remove the token AFTER responding
        user.verificationToken = undefined;
        await user.save();
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ error: 'An error occurred while verifying your email. Please try again.' });
    }
  };


  exports.getUserInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Log the decoded token

        // Fetch user information using decoded._id (instead of decoded.userId)
        const user = await User.findById(decoded._id).select('-password_hash').populate('role');
        if (!user) {
            console.log('User not found for ID:', decoded._id); // Log the missing user ID
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Error in getUserInfo:', err);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

exports.checkmail =  async (req, res) => {
    const { email } = req.query;

    try {
        const user = await User.findOne({ email });
        res.json({ exists: !!user }); // Return true if email exists, false otherwise
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Error checking email' });
    }
}

// Récupérer l'utilisateur avec le plus de points de performance
exports.getBestPerformer = async (req, res) => {
    try {
        // Trouver l'utilisateur avec le plus de points de performance
        const bestPerformer = await User.findOne({
            performancePoints: { $gt: 0 } // Seulement les utilisateurs avec des points positifs
        })
        .sort({ performancePoints: -1 }) // Trier par points de performance (décroissant)
        .select('firstName lastName image performancePoints') // Sélectionner uniquement les champs nécessaires
        .limit(1); // Limiter à un seul résultat

        if (!bestPerformer) {
            return res.status(404).json({ message: 'Aucun utilisateur avec des points de performance trouvé' });
        }

        // Récupérer les tâches de l'utilisateur et l'historique des tâches pour des statistiques précises
        const Task = require('../models/Task');
        const TaskHistory = require('../models/TaskHistory');

        // Récupérer toutes les tâches assignées à l'utilisateur
        const tasks = await Task.find({ assigned_to: bestPerformer._id });

        // Récupérer l'historique des tâches pour cet utilisateur
        // Trouver les entrées d'historique où le statut a été changé à 'Done'
        const taskIds = tasks.map(task => task._id);
        const taskHistories = await TaskHistory.find({
            task_id: { $in: taskIds },
            change_type: 'Status Update',
            new_value: 'Done'
        });

        // Calculer les statistiques de performance à partir de l'historique
        const tasksCompleted = taskHistories.length;

        // Compter les tâches par type de complétion
        const tasksEarly = taskHistories.filter(history => history.completion_type === 'early').length;
        const tasksOnTime = taskHistories.filter(history => history.completion_type === 'on_time').length;
        const tasksLate = taskHistories.filter(history => history.completion_type === 'late').length;

        // Calculer le taux de réussite
        const completionRate = tasksCompleted > 0 ?
            ((tasksEarly + tasksOnTime) / tasksCompleted) * 100 : 0;

        // Calculer le nombre total de points gagnés via les tâches
        const totalPointsEarned = taskHistories.reduce((sum, history) => sum + (history.points_earned || 0), 0);

        // Ajouter les statistiques à l'objet bestPerformer
        const performerWithStats = {
            ...bestPerformer.toObject(),
            stats: {
                tasksCompleted,
                tasksEarly,
                tasksOnTime,
                tasksLate,
                completionRate,
                totalPointsEarned
            }
        };

        res.status(200).json(performerWithStats);
    } catch (error) {
        console.error('Erreur lors de la récupération du meilleur performeur:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// Récupérer les meilleurs performeurs (top 5)
exports.getTopPerformers = async (req, res) => {
    try {
        // Récupérer le nombre de performeurs à afficher (par défaut 5)
        const limit = parseInt(req.query.limit) || 5;

        // Trouver les utilisateurs avec le plus de points de performance
        const topPerformers = await User.find({
            performancePoints: { $gt: 0 } // Seulement les utilisateurs avec des points positifs
        })
        .sort({ performancePoints: -1 }) // Trier par points de performance (décroissant)
        .select('firstName lastName image performancePoints role') // Sélectionner uniquement les champs nécessaires
        .limit(limit); // Limiter au nombre demandé

        // Récupérer des statistiques supplémentaires pour chaque utilisateur
        const performersWithStats = await Promise.all(topPerformers.map(async (performer) => {
            // Ici, vous pourriez récupérer des statistiques supplémentaires comme le nombre de tâches terminées
            // Pour l'exemple, nous allons simuler ces données
            const tasksCompleted = Math.floor(performer.performancePoints / 2) + Math.floor(Math.random() * 5);
            const tasksEarly = Math.floor(tasksCompleted * 0.6);

            return {
                id: performer._id,
                firstName: performer.firstName,
                lastName: performer.lastName,
                fullName: `${performer.firstName} ${performer.lastName}`,
                image: performer.image,
                points: performer.performancePoints,
                role: performer.role,
                stats: {
                    tasksCompleted,
                    tasksEarly,
                    completionRate: tasksEarly / tasksCompleted
                }
            };
        }));

        if (performersWithStats.length === 0) {
            return res.status(404).json({ message: 'Aucun utilisateur avec des points de performance trouvé' });
        }

        res.status(200).json(performersWithStats);
    } catch (error) {
        console.error('Erreur lors de la récupération des meilleurs performeurs:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            error: error.message
        });
    }
}


exports.logout = async (req, res) => {
  try {
      // Update the user's last_activity field (if session exists)
      if (req.session.user) {
          await User.findByIdAndUpdate(req.session.user._id, { last_activity: Date.now() });
      }

      // Destroy the session
      req.session.destroy((err) => {
          if (err) {
              console.error('Error destroying session:', err);
              return res.status(500).json({ message: 'Error logging out', error: err.message });
          }

          // Clear the session cookie after destroying the session
          res.clearCookie('connect.sid'); // Clears the session cookie

          // Send a success response
          res.status(200).json({ message: 'Logged out successfully' });
      });
  } catch (error) {
      console.error('Error updating last_activity:', error);
      res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};



exports.redirectIfAuthenticated = async (req, res, next) => {
  if (req.session.user) {
      console.log('User already signed in. Redirecting to home.');
      return res.redirect('/home'); // Redirect to home if user is already authenticated
  }
  next();
};

exports.redirectIfNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
      console.log('User not authenticated. Redirecting to sign-in.');
      return res.redirect('/signin'); // Redirect to sign-in page if not authenticated
  }
  next(); // Proceed if the user is authenticated
};

exports.resetPassword = async (req, res) => {
    const token = req.query.token || req.body.token;
    const { newPassword, confirmPassword } = req.body;

    try {
      if (!token) {
        return res.status(400).json({ error: 'Token is missing.' });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ error: 'Link expired or invalid.' });
      }

      // Vérifier si le nouveau mot de passe est identique à l'ancien
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({ error: 'Please choose a new password. You cannot reuse your current password.' });
      }

      // Vérifier que les mots de passe correspondent
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      // Valider le nouveau mot de passe
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }

      // Mettre à jour le mot de passe
      user.password_hash = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Log l'action de réinitialisation du mot de passe
      await AccountActivityLog.create({
        userId: user._id,
        action: 'User has reset their password',
      });

      res.status(200).json({ message: 'Password successfully updated!' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while resetting your password.' });
    }
  };

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email); // Log si l'utilisateur n'est pas trouvé
      return res.status(404).json({ error: 'User not found' });
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');

    // Mettre à jour l'utilisateur avec le token et la date d'expiration (1h)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Envoi de l'email
    const resetLink = `http://localhost:5173/resetpassword?token=${token}`;
    const subject = "Password Reset";
    const message = `
      Hello ${user.firstName},

      We received a password reset request for your account.
      If you did not request this, please ignore this email.

      ➡️ **Click the link below to reset your password:**
      🔗 ${resetLink}

      This link will expire in 1 hour.

      Best regards,
      The Lavoro Team
    `;

    console.log('Sending email to:', user.email); // Log avant l'envoi de l'email
    await sendEmail(user.email, subject, message);
    console.log('Email sent successfully to:', user.email); // Log après l'envoi de l'email

    // Renvoyer une réponse JSON au lieu de rediriger
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while sending the email.' });
  }
};

exports.verify2FALogin = async (req, res) => {
  try {
      const { userId, token } = req.body;

      if (!userId || !token) {
          return res.status(400).json({ error: 'User ID and token are required' });
      }

      const user = await User.findById(userId);

      if (!user || !user.twoFactorSecret) {
          return res.status(400).json({ error: '2FA not enabled for this user' });
      }

      // Verify the TOTP code
      const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token,
          window: 1, // Allow a 1-step window for time drift
      });

      if (verified) {
          // Generate a token with 7-day expiration
          const token = jwt.sign(
              { _id: user._id }, // Payload
              process.env.JWT_SECRET, // Secret key
              { expiresIn: '7d' } // Expires in 7 days
          );

          // Return user data and token
          res.status(200).json({ user, token });
      } else {
          res.status(400).json({ error: 'Invalid 2FA code' });
      }
  } catch (error) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({ message: error.message });
  }
};

exports.getTeamManager = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    // Trouver l'ID du rôle "Team Manager"
    const teamManagerRole = await Role.findOne({ RoleName: "Team Manager" });
    if (!teamManagerRole) {
      return res.status(404).json({ error: 'Role "Team Manager" not found' });
    }

    // Trouver les utilisateurs ayant ce rôle et correspondant au terme de recherche
    const teamManagers = await User.find({
      role: teamManagerRole._id,
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } }, // Recherche insensible à la casse
        { lastName: { $regex: searchTerm, $options: "i" } },
      ],
    });


    res.status(200).json(teamManagers);
  } catch (error) {
    console.error("Error fetching team managers:", error);
    res.status(500).json({ error: "An error occurred while fetching team managers" });
  }
};

exports.getAllDevelopers = async (req, res) => {
  try {
    // First, find the developer role in the roles collection
    const developerRole = await Role.findOne({ RoleName: 'Developer' });
    
    if (!developerRole) {
      return res.status(404).json({ 
        success: false, 
        message: 'Developer role not found' 
      });
    }

    // Then find all users with this role ID
    const developers = await User.find({ 
      role: developerRole._id 
    }).populate('role', 'RoleName -_id'); // Populate role name but exclude its _id

    res.status(200).json({ 
      success: true, 
      count: developers.length,
      data: developers 
    });
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching developers',
      error: error.message 
    });
  }
}

exports.getAllDev = async (req, res) => {
  try {
    const devRole = await Role.findOne({ RoleName: "Developer" });
    const devs = await User.find({ role: devRole._id })
      .select('firstName lastName image'); // Sélectionnez seulement les champs nécessaires

    res.status(200).json({
      success: true,
      data: devs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchDevsByName = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    
    const devRole = await Role.findOne({ RoleName: "Developer" });
    const devs = await User.find({
      role: devRole._id,
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('firstName lastName email image');

    res.status(200).json({
      success: true,
      data: devs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};