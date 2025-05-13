const Meeting = require('../models/Meeting');
const User = require('../models/user');
const Role = require('../models/role');
const nodemailer = require('nodemailer');
const transporter = require('../utils/emailConfig');
const { storeEmail } = require('../controllers/emailController');
const jwt = require('jsonwebtoken'); // Not strictly needed here if organizer_id is passed, but good for consistency if we were to decode tokens

const sendMeetingNotificationEmail = async (participantEmail, participantName, meetingDetails, organizer, actionType) => {
  try {
    const subject = actionType === 'create'
      ? `📅 New Meeting Scheduled: ${meetingDetails.title}`
      : `🔄 Meeting Updated: ${meetingDetails.title}`;

    const introMessage = actionType === 'create'
      ? `You have been invited to a new meeting :`
      : `The details for the meeting "${meetingDetails.title}" have been updated. Please see the new details below:`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; color: #343a40; }
        .container { max-width: 650px; margin: 30px auto; background-color: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #007bff; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
        .header h2 { color: #0056b3; margin: 0; font-size: 26px; }
        .content { padding: 20px 0; line-height: 1.7; }
        .content p { margin-bottom: 15px; }
        .footer { text-align: center; padding-top: 20px; font-size: 0.9em; color: #6c757d; border-top: 1px solid #eeeeee; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 25px; margin: 20px 0; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: #218838; }
        .details-table { width: 100%; margin: 25px 0; border-collapse: collapse; }
        .details-table th, .details-table td { border: 1px solid #dee2e6; text-align: left; padding: 12px; }
        .details-table th { background-color: #e9ecef; color: #495057; font-weight: bold; }
        .highlight { color: #007bff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${subject}</h2>
        </div>
        <div class="content">
          <p>Hello <span class="highlight">${participantName || 'Participant'}</span>,</p>
          <p>${introMessage}</p>
          <table class="details-table">
            <tr><th>Title</th><td>${meetingDetails.title}</td></tr>
            ${meetingDetails.description ? `<tr><th>Description</th><td>${meetingDetails.description}</td></tr>` : ''}
            <tr><th>Start Time</th><td>${new Date(meetingDetails.start_time).toLocaleString()}</td></tr>
            <tr><th>End Time</th><td>${new Date(meetingDetails.end_time).toLocaleString()}</td></tr>
          </table>
          ${meetingDetails.meeting_link ? `<p style="text-align: center;"><a href="${meetingDetails.meeting_link}" class="button">Join Meeting</a></p>` : ''}
          <p>If you have any questions, please contact the organizer: <a href="mailto:${organizer.email}">${organizer.email}</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LAVORO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const plainTextContent = `
Hello ${participantName || 'Participant'},

${introMessage}

Meeting Details:
Title: ${meetingDetails.title}
${meetingDetails.description ? `Description: ${meetingDetails.description}` : ''}
Start Time: ${new Date(meetingDetails.start_time).toLocaleString()}
End Time: ${new Date(meetingDetails.end_time).toLocaleString()}

${meetingDetails.meeting_link ? `You can join the meeting here: ${meetingDetails.meeting_link}` : ''}

If you have any questions, please contact the organizer: ${organizer.email}.

Best regards,
LAVORO Team
`;

    const mailData = {
      from: `LAVORO <${process.env.EMAIL_USER || 'no-reply@lavoro.com'}>`,
      to: participantEmail,
      subject: subject,
      html: htmlContent,
      text: plainTextContent, // Added plain text version
      meetingId: meetingDetails._id.toString(),
      direction: 'sent',
      senderUserId: organizer._id.toString(),
      receiverUserId: null // Will be set after fetching participant user object
    };

    const participantUser = await User.findOne({ email: participantEmail }).select('_id');
    if (participantUser) {
      mailData.receiverUserId = participantUser._id.toString();
    } else {
      console.warn(`Participant with email ${participantEmail} not found. Cannot set receiverUserId for email record.`);
    }

    await transporter.sendMail(mailData);
    await storeEmail(mailData); // Store sender's copy

    if (mailData.receiverUserId) {
      const receivedEmailData = { ...mailData, direction: 'received' };
      await storeEmail(receivedEmailData); // Store receiver's copy
    }

  } catch (error) {
    console.error('Error sending meeting notification email:', error);
  }
};

// Créer une réunion
exports.createMeeting = async (req, res) => {
    try {
        const { title, description, start_time, end_time, participants, organizer_id } = req.body;

        if (!organizer_id) {
            return res.status(400).json({ message: 'Organizer ID is required.' });
        }

        const roomName = `lavoro-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const meetingLink = `https://meet.jit.si/${roomName}`;

        const meeting = new Meeting({
            organizer_id,
            title,
            description,
            start_time: new Date(start_time),
            end_time: new Date(end_time),
            participants, // Array of User IDs
            meeting_link: meetingLink
        });

        const savedMeeting = await meeting.save();

        const organizer = await User.findById(organizer_id).select('firstName lastName email');
        if (!organizer) {
            console.warn(`Organizer with ID ${organizer_id} not found. Meeting created, but emails may not be sent.`);
        } else {
            if (participants && participants.length > 0) {
                const participantDetails = await User.find({ '_id': { $in: participants } }).select('email firstName lastName');
                participantDetails.forEach(participant => {
                    sendMeetingNotificationEmail(
                        participant.email,
                        `${participant.firstName} ${participant.lastName}`,
                        savedMeeting,
                        organizer,
                        'create'
                    );
                });
            }
        }
        res.status(201).json(savedMeeting);
    } catch (error) {
        console.error("Error in createMeeting:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: error.message || 'An unexpected error occurred during meeting creation.' });
    }
};

// Mettre à jour une réunion
exports.updateMeeting = async (req, res) => {
    try {
        const { title, description, start_time, end_time, participants } = req.body;
        const meetingId = req.params.id;

        const existingMeeting = await Meeting.findById(meetingId);
        if (!existingMeeting) {
            return res.status(404).json({ message: 'Meeting not found to determine organizer.' });
        }
        const organizer_id = existingMeeting.organizer_id;

        const updatedMeeting = await Meeting.findByIdAndUpdate(
            meetingId,
            {
                title,
                description,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                participants // Array of User IDs
            },
            { new: true, runValidators: true }
        ).populate('participants', 'email firstName lastName'); // Populate for immediate use if needed

        if (!updatedMeeting) {
            return res.status(404).json({ message: 'Meeting not found or failed to update.' });
        }

        const organizer = await User.findById(organizer_id).select('firstName lastName email');
        if (!organizer) {
            console.warn(`Organizer with ID ${organizer_id} not found for updated meeting. Emails may not be sent.`);
        } else {
            // Use updatedMeeting.participants which should now be populated if you added .populate()
            // Or fetch again if not populated or to be absolutely sure
            const finalParticipants = updatedMeeting.participants && updatedMeeting.participants.length > 0 ? updatedMeeting.participants : [];
            
            // If participants array in request is the source of truth for who to notify:
            if (participants && participants.length > 0) {
                 const participantDetails = await User.find({ '_id': { $in: participants } }).select('email firstName lastName');
                 participantDetails.forEach(participant => {
                    sendMeetingNotificationEmail(
                        participant.email,
                        `${participant.firstName} ${participant.lastName}`,
                        updatedMeeting,
                        organizer,
                        'update'
                    );
                });
            }
        }

        res.json(updatedMeeting);
    } catch (error) {
        console.error("Error in updateMeeting:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: error.message || 'An unexpected error occurred during meeting update.' });
    }
};


// Récupérer toutes les réunions
exports.getAllMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find()
            .populate('organizer_id', 'firstName lastName email') // Populate organizer details
            .populate('participants', 'firstName lastName email') // Populate participant details
            .sort({ start_time: 1 });
        
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer une réunion par ID
exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('organizer_id', 'firstName lastName email')
            .populate('participants', 'firstName lastName email');
        
        if (!meeting) {
            return res.status(404).json({ message: 'Réunion non trouvée' });
        }
        
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Supprimer une réunion
exports.deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndDelete(req.params.id);
        
        if (!meeting) {
            return res.status(404).json({ message: 'Réunion non trouvée' });
        }
        
        // Optionally: Send cancellation emails to participants
        // const organizer = await User.findById(meeting.organizer_id).select('firstName lastName email');
        // if (organizer && meeting.participants && meeting.participants.length > 0) {
        //     const participantDetails = await User.find({ '_id': { $in: meeting.participants } }).select('email firstName lastName');
        //     participantDetails.forEach(participant => {
        //         // sendMeetingNotificationEmail(participant.email, `${participant.firstName} ${participant.lastName}`, meeting, organizer, 'cancel');
        //         // You'd need to add a 'cancel' type to sendMeetingNotificationEmail or a new function
        //     });
        // }

        res.json({ message: 'Réunion supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer les utilisateurs et team managers pour le formulaire
exports.getUsersAndTeamManagers = async (req, res) => {
    try {
        const users = await User.find({ is_active: true })
            .select('firstName lastName email role') // Include role for potential filtering on frontend
            .sort({ lastName: 1, firstName: 1 });
        
        // This part might be redundant if all users are already fetched and can be filtered on frontend
        // Or, if specific 'Team Manager' role is needed for a dedicated dropdown, it's fine.
        const teamManagerRole = await Role.findOne({ RoleName: 'Team Manager' }); 
        
        let teamManagers = [];
        if (teamManagerRole) {
            teamManagers = await User.find({ 
                role: teamManagerRole._id,
                is_active: true 
            }).select('firstName lastName email');
        } else {
            console.warn('Team Manager role not found. Team managers list will be empty.');
        }
        
        res.json({
            users, // All active users
            teamManagers // Users specifically with 'Team Manager' role
        });
    } catch (error) {
        console.error("Error in getUsersAndTeamManagers:", error);
        res.status(500).json({ message: error.message });
    }
};