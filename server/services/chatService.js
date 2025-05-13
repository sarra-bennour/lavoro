/**
 * Chat Service for Lavoro Backend
 * This service handles all chat-related functionality including:
 * - Direct messaging
 * - Group chats
 * - Socket.io event handling
 * - Message storage and retrieval
 */

const Chat = require('../models/chat');
const User = require('../models/user');
const ChatGroup = require('../models/chatGroup');
const GroupMessage = require('../models/groupMessage');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper function to get user details (already defined in chatController, can be moved here)
const getUserDetails = async (userId) => {
    try {
        console.log(`Fetching details for user ID: ${userId}`);

        // Check if userId is an object (already populated) or a string/ObjectId
        if (userId && typeof userId === 'object' && userId.firstName) {
            console.log('User object already populated:', userId);

            // User object is already populated, we can use it directly
            const user = userId;

            // Ensure name is defined
            if (!user.name) {
                user.name = `${user.firstName} ${user.lastName || ''}`.trim();
            }

            // Ensure profileImage is defined
            if (!user.profileImage) {
                user.profileImage = user.image;
            }

            // Ensure we have a valid profile image URL
            if (!user.profileImage) {
                // Use a generated avatar if no image is available
                user.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4a6bff&color=fff`;
            }

            console.log(`Using pre-populated user: ${user.name}, Image: ${user.profileImage ? 'Yes' : 'No'}`);
            return user;
        }

        // Otherwise, retrieve the user from the database
        const user = await User.findById(userId).select('firstName lastName email image phone_number role');
        if (user) {
            // Combine firstName and lastName to create a full name
            user.name = `${user.firstName} ${user.lastName || ''}`.trim();

            // Map image to profileImage for frontend compatibility
            user.profileImage = user.image;

            // Ensure we have a valid profile image URL
            if (!user.profileImage) {
                // Use a generated avatar if no image is available
                user.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4a6bff&color=fff`;
            }

            console.log(`User details fetched successfully: ${user.name}, Image: ${user.profileImage ? 'Yes' : 'No'}`);
        } else {
            console.log(`User not found for ID: ${userId}`);
        }
        return user;
    } catch (error) {
        console.error(`Error fetching user details for ID ${userId}:`, error);
        return null;
    }
};

/**
 * Socket.io connection management
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket connection
 * @param {String} userId - User ID
 */
const connectSocket = (io, socket, userId) => {
    console.log(`User ${userId} connected to socket`);
    socket.join(userId);
    // You could update user's online status in the database here
};

/**
 * Get all chats for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Array of conversations
 */
const getUserChats = async (userId) => {
    try {
        console.log(`Getting chats for user: ${userId}`);

        // Find all chats where the user is either sender or receiver
        const chats = await Chat.find({
            $or: [
                { sender_id: userId },
                { receiver_id: userId }
            ]
        }).sort({ sent_at: -1 });

        console.log(`Found ${chats.length} chat messages for user ${userId}`);

        // Group chats by the other user (conversation partner)
        const conversations = {};

        for (const chat of chats) {
            const otherUserId = chat.sender_id.toString() === userId ?
                chat.receiver_id.toString() : chat.sender_id.toString();

            // Skip empty messages or test messages
            if (!chat.message || chat.message.trim() === '') {
                console.log(`Skipping empty message: ${chat._id}`);
                continue;
            }

            if (!conversations[otherUserId]) {
                const otherUser = await getUserDetails(otherUserId);
                if (!otherUser) {
                    console.log(`User not found for ID: ${otherUserId}, skipping`);
                    continue;
                }

                // Add default status for frontend display
                otherUser.status = 'online';

                // Ensure name is properly defined
                if (!otherUser.name || otherUser.name.trim() === '') {
                    otherUser.name = otherUser.firstName || 'User';
                }

                // Ensure profile image is defined
                if (!otherUser.profileImage) {
                    otherUser.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=4a6bff&color=fff`;
                }

                console.log(`Adding conversation with user: ${otherUser.name}, Image: ${otherUser.profileImage}`);

                conversations[otherUserId] = {
                    user: otherUser,
                    lastMessage: chat,
                    unreadCount: chat.sender_id.toString() !== userId && !chat.is_read ? 1 : 0
                };
            } else if (chat.sender_id.toString() !== userId && !chat.is_read) {
                conversations[otherUserId].unreadCount += 1;
            }
        }

        return Object.values(conversations);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        throw error;
    }
};

/**
 * Get conversation between two users
 * @param {String} userId - Current user ID
 * @param {String} otherUserId - Other user ID
 * @returns {Promise<Object>} - Conversation data
 */
const getConversation = async (userId, otherUserId) => {
    try {
        console.log(`Getting conversation between users ${userId} and ${otherUserId}`);

        // Find all messages between the two users
        let messages = await Chat.find({
            $or: [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId }
            ]
        }).sort({ sent_at: 1 });

        console.log(`Found ${messages.length} messages between users ${userId} and ${otherUserId}`);

        // Mark all messages as read
        const updateResult = await Chat.updateMany(
            { sender_id: otherUserId, receiver_id: userId, is_read: false },
            { $set: { is_read: true } }
        );
        console.log(`Marked ${updateResult.modifiedCount} messages as read`);

        // Get user details
        const otherUser = await getUserDetails(otherUserId);
        const currentUser = await getUserDetails(userId);

        if (!otherUser) {
            console.log(`Other user ${otherUserId} not found`);
            return { messages: [] };
        }

        // Ensure name is properly defined
        if (!otherUser.name || otherUser.name.trim() === '') {
            otherUser.name = otherUser.firstName || 'User';
        }

        // Ensure profile image is defined
        if (!otherUser.profileImage) {
            otherUser.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=4a6bff&color=fff`;
        }

        console.log(`Conversation with user: ${otherUser.name}, Image: ${otherUser.profileImage}`);

        // Add default status
        otherUser.status = 'online';

        // Add sender information to each message
        messages = await Promise.all(messages.map(async (message) => {
            const messageObj = message.toObject();

            // Add sender information to the message
            if (message.sender_id.toString() === userId) {
                messageObj.sender = currentUser;
            } else {
                messageObj.sender = otherUser;
            }

            return messageObj;
        }));

        return {
            messages,
            user: otherUser
        };
    } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }
};

/**
 * Send a message
 * @param {Object} messageData - Message data
 * @param {Object} file - Attached file (optional)
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Sent message
 */
const sendMessage = async (messageData, file, io) => {
    try {
        console.log('Sending message:', messageData);
        console.log('With file:', file);

        const { sender_id, receiver_id } = messageData;
        let { message } = messageData;

        // Ensure message is a string and not undefined or null
        if (message === undefined || message === null) {
            message = '';
        }

        // Create message data object
        const newMessageData = {
            sender_id,
            receiver_id,
            message: message,
            sent_at: new Date(),
            is_read: false
        };

        // If there's no message text but there is a file, set a default message
        if ((!message || message.trim() === '') && file) {
            newMessageData.message = 'Attachment';
        }

        // Create new message
        const newMessage = new Chat(newMessageData);

        // Handle file attachment if present
        if (file) {
            console.log('Processing file attachment:', file);

            const fileType = file.mimetype.split('/')[0];
            const fileExtension = file.originalname.split('.').pop().toLowerCase();

            console.log('File type:', fileType, 'Extension:', fileExtension);

            newMessage.attachment = file.filename;

            // Determine attachment type based on mimetype and extension
            if (fileType === 'image') {
                newMessage.attachment_type = 'image';
            } else if (fileType === 'video') {
                newMessage.attachment_type = 'video';
            } else if (fileExtension === 'pdf') {
                newMessage.attachment_type = 'pdf';
            } else if (['doc', 'docx'].includes(fileExtension)) {
                newMessage.attachment_type = 'word';
            } else if (['xls', 'xlsx'].includes(fileExtension)) {
                newMessage.attachment_type = 'excel';
            } else if (['zip', 'rar'].includes(fileExtension)) {
                newMessage.attachment_type = 'archive';
            } else {
                newMessage.attachment_type = 'file';
            }

            console.log('Attachment type set to:', newMessage.attachment_type);
        }

        console.log('Saving message to database:', newMessage);

        await newMessage.save();
        console.log('Message saved successfully');

        // Emit the message to the receiver
        if (io) {
            console.log('Emitting message to receiver:', receiver_id);
            const senderDetails = await getUserDetails(sender_id);
            io.to(receiver_id).emit('new_message', {
                message: newMessage,
                sender: senderDetails
            });
        }

        // Get sender details to include in the response
        const senderDetails = await getUserDetails(sender_id);

        // Create a response object with sender information
        const responseMessage = {
            ...newMessage.toObject(),
            sender: senderDetails
        };

        console.log('Message sent successfully with sender details');
        return responseMessage;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

/**
 * Delete a message
 * @param {String} messageId - Message ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Boolean>} - Success status
 */
const deleteMessage = async (messageId, io) => {
    try {
        // Find and delete the message
        const message = await Chat.findByIdAndDelete(messageId);

        if (!message) {
            return false;
        }

        // Delete attachment if exists
        if (message.attachment) {
            const filePath = path.join(__dirname, '../public/uploads/chat', message.attachment);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Notify the receiver about the deleted message
        if (io) {
            io.to(message.receiver_id.toString()).emit('message_deleted', messageId);
        }

        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

/**
 * Get all chat groups for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Array of groups
 */
const getUserGroups = async (userId) => {
    try {
        // Find all groups where the user is a member
        const groups = await ChatGroup.find({
            members: userId
        }).populate('creator', 'firstName lastName email image')
          .populate('members', 'firstName lastName email image');

        // Get last message for each group
        const groupsWithLastMessage = await Promise.all(groups.map(async (group) => {
            const lastMessage = await GroupMessage.findOne({ group_id: group._id })
                .sort({ sent_at: -1 })
                .populate('sender_id', 'firstName lastName email image');

            // Count unread messages
            const unreadCount = await GroupMessage.countDocuments({
                group_id: group._id,
                read_by: { $ne: userId }
            });

            return {
                ...group.toObject(),
                lastMessage,
                unreadCount
            };
        }));

        return groupsWithLastMessage;
    } catch (error) {
        console.error('Error fetching user groups:', error);
        throw error;
    }
};

/**
 * Create a new chat group
 * @param {Object} groupData - Group data
 * @param {Object} file - Group avatar file (optional)
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Created group
 */
const createGroup = async (groupData, file, io) => {
    try {
        const { name, description, creator, members } = groupData;

        // Create new group
        const newGroup = new ChatGroup({
            name,
            description,
            creator,
            members: [...new Set([creator, ...members])], // Ensure unique members including creator
            last_message: new Date()
        });

        // Handle group avatar if present
        if (file) {
            newGroup.avatar = file.filename;
        }

        await newGroup.save();

        // Notify all members about the new group
        if (io) {
            members.forEach(memberId => {
                io.to(memberId).emit('new_group', newGroup);
            });
        }

        return newGroup;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

/**
 * Get messages for a group
 * @param {String} groupId - Group ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Group messages data
 */
const getGroupMessages = async (groupId, userId) => {
    try {
        console.log(`Getting messages for group ${groupId} and user ${userId}`);

        // Find all messages for the group
        let messages = await GroupMessage.find({ group_id: groupId })
            .sort({ sent_at: 1 });

        console.log(`Found ${messages.length} messages for group ${groupId}`);

        // Mark messages as read by this user
        const updateResult = await GroupMessage.updateMany(
            { group_id: groupId, read_by: { $ne: userId } },
            { $addToSet: { read_by: userId } }
        );
        console.log(`Marked ${updateResult.modifiedCount} messages as read`);

        // Get group details
        const group = await ChatGroup.findById(groupId)
            .populate('creator', 'firstName lastName email image')
            .populate('members', 'firstName lastName email image');

        // Convert messages to plain objects and preserve sender_id
        messages = messages.map(message => {
            const messageObj = message.toObject();

            // Ensure sender_id is a string to avoid serialization issues
            if (messageObj.sender_id) {
                messageObj.sender_id = messageObj.sender_id.toString();
            }

            return messageObj;
        });

        return {
            messages,
            group
        };
    } catch (error) {
        console.error('Error fetching group messages:', error);
        throw error;
    }
};

/**
 * Send a message to a group
 * @param {Object} messageData - Message data
 * @param {Object} file - Attached file (optional)
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Sent message
 */
const sendGroupMessage = async (messageData, file, io) => {
    try {
        console.log('Sending group message:', messageData);
        console.log('With file for group:', file);

        const { group_id, sender_id } = messageData;
        let { message } = messageData;

        // Ensure message is a string and not undefined or null
        if (message === undefined || message === null) {
            message = '';
        }

        // Create message data object
        const messageData = {
            group_id,
            sender_id,
            message: message,
            sent_at: new Date(),
            read_by: [sender_id] // Sender has read the message
        };

        // If there's no message text but there is a file, set a default message
        if ((!message || message.trim() === '') && file) {
            messageData.message = 'Attachment';
        }

        // Create new message
        const newMessage = new GroupMessage(messageData);

        // Handle file attachment if present
        if (file) {
            const fileType = file.mimetype.split('/')[0];
            const fileExtension = file.originalname.split('.').pop().toLowerCase();

            newMessage.attachment = file.filename;

            // Determine attachment type based on mimetype and extension
            if (fileType === 'image') {
                newMessage.attachment_type = 'image';
            } else if (fileType === 'video') {
                newMessage.attachment_type = 'video';
            } else if (fileExtension === 'pdf') {
                newMessage.attachment_type = 'pdf';
            } else if (['doc', 'docx'].includes(fileExtension)) {
                newMessage.attachment_type = 'word';
            } else if (['xls', 'xlsx'].includes(fileExtension)) {
                newMessage.attachment_type = 'excel';
            } else if (['zip', 'rar'].includes(fileExtension)) {
                newMessage.attachment_type = 'archive';
            } else {
                newMessage.attachment_type = 'file';
            }
        }

        await newMessage.save();

        // Update group's last message timestamp
        await ChatGroup.findByIdAndUpdate(group_id, {
            last_message: new Date()
        });

        // Get group members
        const group = await ChatGroup.findById(group_id);

        // Get sender details
        const fullSenderInfo = await User.findById(sender_id).select('firstName lastName email image');

        if (fullSenderInfo && io) {
            // Create a complete sender object with all necessary information
            const enhancedSender = {
                _id: fullSenderInfo._id,
                firstName: fullSenderInfo.firstName,
                lastName: fullSenderInfo.lastName || '',
                email: fullSenderInfo.email,
                image: fullSenderInfo.image,
                name: `${fullSenderInfo.firstName} ${fullSenderInfo.lastName || ''}`.trim(),
                profileImage: fullSenderInfo.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullSenderInfo.firstName)}&background=4a6bff&color=fff`
            };

            // Emit the message to all group members
            for (const memberId of group.members) {
                if (memberId.toString() !== sender_id) {
                    io.to(memberId.toString()).emit('new_group_message', {
                        message: newMessage,
                        sender: enhancedSender,
                        group: group
                    });
                }
            }

            // Create a response object with sender information
            const responseMessage = {
                ...newMessage.toObject(),
                sender: enhancedSender
            };

            return responseMessage;
        } else {
            // Fallback if we can't get the complete user
            const senderInfo = await getUserDetails(sender_id);

            if (io) {
                // Emit the message to all group members
                for (const memberId of group.members) {
                    if (memberId.toString() !== sender_id) {
                        io.to(memberId.toString()).emit('new_group_message', {
                            message: newMessage,
                            sender: senderInfo,
                            group: group
                        });
                    }
                }
            }

            // Create a response object with sender information
            const responseMessage = {
                ...newMessage.toObject(),
                sender: senderInfo
            };

            return responseMessage;
        }
    } catch (error) {
        console.error('Error sending group message:', error);
        throw error;
    }
};

/**
 * Delete a group message
 * @param {String} messageId - Message ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Boolean>} - Success status
 */
const deleteGroupMessage = async (messageId, io) => {
    try {
        // Find and delete the message
        const message = await GroupMessage.findByIdAndDelete(messageId);

        if (!message) {
            return false;
        }

        // Delete attachment if exists
        if (message.attachment) {
            const filePath = path.join(__dirname, '../public/uploads/chat', message.attachment);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (io) {
            // Get group members
            const group = await ChatGroup.findById(message.group_id);

            // Notify all group members about the deleted message
            group.members.forEach(memberId => {
                if (memberId.toString() !== message.sender_id.toString()) {
                    io.to(memberId.toString()).emit('group_message_deleted', {
                        messageId,
                        groupId: message.group_id
                    });
                }
            });
        }

        return true;
    } catch (error) {
        console.error('Error deleting group message:', error);
        throw error;
    }
};

/**
 * Update a message
 * @param {String} messageId - Message ID
 * @param {String} newMessage - New message content
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Updated message
 */
const updateMessage = async (messageId, newMessage, io) => {
    try {
        // Find the message
        const message = await Chat.findById(messageId);

        if (!message) {
            return null;
        }

        // Update the message
        message.message = newMessage;
        message.edited = true;
        message.edited_at = new Date();

        await message.save();

        // Notify the receiver about the updated message
        if (io) {
            io.to(message.receiver_id.toString()).emit('message_updated', {
                messageId,
                newMessage,
                edited_at: message.edited_at
            });
        }

        // Get sender details to include in the response
        const senderDetails = await getUserDetails(message.sender_id);

        // Create a response object with sender information
        const responseMessage = {
            ...message.toObject(),
            sender: senderDetails
        };

        return responseMessage;
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
};

/**
 * Update a group message
 * @param {String} messageId - Message ID
 * @param {String} newMessage - New message content
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Updated message
 */
const updateGroupMessage = async (messageId, newMessage, io) => {
    try {
        // Find the message
        const message = await GroupMessage.findById(messageId);

        if (!message) {
            return null;
        }

        // Update the message
        message.message = newMessage;
        message.edited = true;
        message.edited_at = new Date();

        await message.save();

        if (io) {
            // Get group members
            const group = await ChatGroup.findById(message.group_id);

            // Get sender details
            const senderDetails = await getUserDetails(message.sender_id);

            // Notify all group members about the updated message
            group.members.forEach(memberId => {
                if (memberId.toString() !== message.sender_id.toString()) {
                    io.to(memberId.toString()).emit('group_message_updated', {
                        messageId,
                        groupId: message.group_id,
                        newMessage,
                        edited_at: message.edited_at,
                        sender: senderDetails
                    });
                }
            });
        }

        // Get sender details to include in the response
        const senderDetails = await getUserDetails(message.sender_id);

        // Create a response object with sender information
        const responseMessage = {
            ...message.toObject(),
            sender: senderDetails
        };

        return responseMessage;
    } catch (error) {
        console.error('Error updating group message:', error);
        throw error;
    }
};

/**
 * Get all contacts (users)
 * @param {String} userId - Current user ID
 * @returns {Promise<Object>} - Contacts grouped by first letter
 */
const getContacts = async (userId) => {
    try {
        // Get all users except the current user
        const users = await User.find({ _id: { $ne: userId } })
            .select('firstName lastName email image')
            .sort({ firstName: 1 });

        // Group users by first letter of name
        const contacts = {};

        users.forEach(user => {
            // Combine firstName and lastName to create a full name
            user.name = `${user.firstName} ${user.lastName || ''}`.trim();

            // Map image to profileImage for frontend compatibility
            user.profileImage = user.image;

            const firstLetter = user.name.charAt(0).toUpperCase();
            if (!contacts[firstLetter]) {
                contacts[firstLetter] = [];
            }
            contacts[firstLetter].push(user);
        });

        return contacts;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};

/**
 * Add user to group
 * @param {String} groupId - Group ID
 * @param {String} userId - User ID to add
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Updated group
 */
const addUserToGroup = async (groupId, userId, io) => {
    try {
        // Add user to group
        const updatedGroup = await ChatGroup.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: userId } },
            { new: true }
        ).populate('creator', 'firstName lastName email image')
         .populate('members', 'firstName lastName email image');

        // Notify the user about being added to the group
        if (io) {
            io.to(userId).emit('added_to_group', updatedGroup);
        }

        return updatedGroup;
    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
};

/**
 * Remove user from group
 * @param {String} groupId - Group ID
 * @param {String} userId - User ID to remove
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} - Updated group
 */
const removeUserFromGroup = async (groupId, userId, io) => {
    try {
        // Remove user from group
        const updatedGroup = await ChatGroup.findByIdAndUpdate(
            groupId,
            { $pull: { members: userId } },
            { new: true }
        ).populate('creator', 'firstName lastName email image')
         .populate('members', 'firstName lastName email image');

        // Notify the user about being removed from the group
        if (io) {
            io.to(userId).emit('removed_from_group', updatedGroup);
        }

        return updatedGroup;
    } catch (error) {
        console.error('Error removing user from group:', error);
        throw error;
    }
};

// Socket event handlers
const handleSocketEvents = (io, socket) => {
    // Handle user joining with their ID
    socket.on('user_connected', (userId) => {
        console.log(`User ${userId} connected`);
        socket.join(userId);
    });

    // Handle private message
    socket.on('private_message', async (data) => {
        try {
            const responseMessage = await sendMessage(data, null, io);
            socket.emit('message_sent', responseMessage);
        } catch (error) {
            console.error('Error handling private message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });

    // Handle group message
    socket.on('group_message', async (data) => {
        try {
            const responseMessage = await sendGroupMessage(data, null, io);
            socket.emit('group_message_sent', responseMessage);
        } catch (error) {
            console.error('Error handling group message:', error);
            socket.emit('message_error', { error: 'Failed to send group message' });
        }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { sender_id, receiver_id } = data;
        io.to(receiver_id).emit('user_typing', { sender_id });
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
        const { sender_id, receiver_id } = data;
        io.to(receiver_id).emit('user_stop_typing', { sender_id });
    });

    // Handle read receipt
    socket.on('message_read', async (data) => {
        const { message_id, reader_id } = data;

        try {
            // Update message read status
            const message = await Chat.findByIdAndUpdate(
                message_id,
                { is_read: true },
                { new: true }
            );

            if (message) {
                // Notify the sender
                io.to(message.sender_id.toString()).emit('message_read_receipt', {
                    message_id,
                    reader_id
                });
            }
        } catch (error) {
            console.error('Error updating read receipt:', error);
        }
    });

    // Handle group message read
    socket.on('group_message_read', async (data) => {
        const { message_id, reader_id } = data;

        try {
            // Update message read status
            const message = await GroupMessage.findByIdAndUpdate(
                message_id,
                { $addToSet: { read_by: reader_id } },
                { new: true }
            );

            if (message) {
                // Notify the sender
                io.to(message.sender_id.toString()).emit('group_message_read_receipt', {
                    message_id,
                    reader_id,
                    group_id: message.group_id
                });
            }
        } catch (error) {
            console.error('Error updating group read receipt:', error);
        }
    });

    // Handle message update
    socket.on('update_message', async (data) => {
        const { message_id, new_message } = data;

        try {
            const updatedMessage = await updateMessage(message_id, new_message, io);
            if (updatedMessage) {
                socket.emit('message_updated_confirmation', updatedMessage);
            } else {
                socket.emit('message_error', { error: 'Failed to update message' });
            }
        } catch (error) {
            console.error('Error handling message update:', error);
            socket.emit('message_error', { error: 'Failed to update message' });
        }
    });

    // Handle group message update
    socket.on('update_group_message', async (data) => {
        const { message_id, new_message } = data;

        try {
            const updatedMessage = await updateGroupMessage(message_id, new_message, io);
            if (updatedMessage) {
                socket.emit('group_message_updated_confirmation', updatedMessage);
            } else {
                socket.emit('message_error', { error: 'Failed to update group message' });
            }
        } catch (error) {
            console.error('Error handling group message update:', error);
            socket.emit('message_error', { error: 'Failed to update group message' });
        }
    });
};

module.exports = {
    getUserDetails,
    connectSocket,
    getUserChats,
    getConversation,
    sendMessage,
    deleteMessage,
    updateMessage,
    getUserGroups,
    createGroup,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    updateGroupMessage,
    getContacts,
    addUserToGroup,
    removeUserFromGroup,
    handleSocketEvents
};
