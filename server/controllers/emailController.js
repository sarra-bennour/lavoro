

const Email = require('../models/email');



const mongoose = require('mongoose');




exports.markEmailAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // assuming you're using JWT middleware
    const { emailId } = req.params;

    const email = await Email.findOne({
      _id: emailId,
      receiverUser: userId
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found or not authorized' });
    }

    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.status(200).json({ message: 'Email marked as read', email });
  } catch (error) {
    console.error('Error marking email as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.storeEmail = async (emailData) => {
  try {
    const newEmail = new Email({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      relatedProject: emailData.projectId || null,
      direction: emailData.direction,
      senderUser: emailData.senderUserId ? new mongoose.Types.ObjectId(emailData.senderUserId) : null,
      receiverUser: emailData.receiverUserId ? new mongoose.Types.ObjectId(emailData.receiverUserId) : null,
      status: emailData.status || null
    });
    
    
    await newEmail.save();
    return newEmail;
  } catch (error) {
    console.error('Error storing email:', error);
    throw error;
  }
};


exports.getEmailById = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const email = await Email.findOne({
      _id: req.params.id,
      $or: [
        { senderUser: userId },
        { receiverUser: userId }
      ]
    })
    .populate('relatedProject')
    .populate('senderUser', 'name email')
    .populate('receiverUser', 'name email');
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found or unauthorized access' });
    }
    
    // Mark as read when fetched (only if user is the receiver)
    if (!email.isRead && email.receiverUser && email.receiverUser._id.equals(userId)) {
      email.isRead = true;
      await email.save();
    }
    
    res.status(200).json(email);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getEmails = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const emails = await Email.find({
      $or: [
        { senderUser: userId },
        { receiverUser: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('relatedProject', 'name')
    .populate('senderUser', 'name email')
    .populate('receiverUser', 'name email');
    
    // Ensure you're sending just the array of emails
    res.status(200).json(emails); // Not { data: emails } or similar
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ 
      message: 'Error fetching emails',
      error: error.message
    });
  }
};


// controllers/projectController.js

// Toggle Starred Status
exports.toggleStarEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user._id;
    console.log('EmailId:', emailId);
    console.log('UserId:', userId);
    const email = await Email.findOne({
      _id: emailId,
      $or: [
        { senderUser: userId },
        { receiverUser: userId }
      ]
    });
    console.log('Found email?', email);
    


    if (!email) {
      return res.status(404).json({ message: 'Email not found or unauthorized' });
    }

    email.isStarred = !email.isStarred;
    await email.save();

    res.status(200).json({ 
      message: 'Email star status updated',
      isStarred: email.isStarred 
    });
  } catch (error) {
    console.error('Error toggling star:', error);
    res.status(500).json({ message: 'Error updating star status' });
  }
};

// Toggle Archive Status
exports.toggleArchiveEmail = async (req, res) => {

  try {
    const { emailId } = req.params;
    const userId = req.user._id;

    console.log('EmailId:', emailId);
console.log('UserId:', userId);
const email = await Email.findOne({
  _id: emailId,
  $or: [
    { senderUser: userId },
    { receiverUser: userId }
  ]
});
console.log('Found email?', email);


    if (!email) {
      return res.status(404).json({ message: 'Email not found or unauthorized' });
    }

    email.isArchived = !email.isArchived;
    await email.save();

    res.status(200).json({ 
      message: 'Email archive status updated',
      isArchived: email.isArchived 
    });
  } catch (error) {
    console.error('Error toggling archive:', error);
    res.status(500).json({ message: 'Error updating archive status' });
  }
};

// Delete Email
exports.deleteEmail = async (req, res) => {
  try {
    console.log("Params received in deleteEmail:", req.params);

    const { emailId } = req.params;
    const userId = req.user._id;

    console.log('EmailId:', emailId);
    console.log('UserId:', userId);

    const email = await Email.findOneAndDelete({
      _id: emailId,
      $or: [
        { senderUser: userId },
        { receiverUser: userId }
      ]
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found or unauthorized' });
    }

    res.status(200).json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Error deleting email' });
  }
};




// New controller for sending emails
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, text, projectId } = req.body;
    const senderUserId = req.user._id;
    
    const mailData = {
      from: `LAVORO <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to,
      subject,
      text,
      projectId: projectId || null,
      direction: 'sent',
      senderUserId
    };
    
    const newEmail = await storeEmail(mailData);
    res.status(201).json(newEmail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
