const chatService = require('../services/chatService');

// Get all chats for a user
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Use the chat service to get user chats
        const conversations = await chatService.getUserChats(userId);

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user chats',
            error: error.message
        });
    }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        // Use the chat service to get the conversation
        const conversationData = await chatService.getConversation(userId, otherUserId);

        if (!conversationData.user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: { messages: [] }
            });
        }

        res.status(200).json({
            success: true,
            data: conversationData
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversation',
            error: error.message
        });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to send the message
        const responseMessage = await chatService.sendMessage(req.body, req.file, io);

        res.status(201).json({
            success: true,
            data: responseMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        console.error('Error stack:', error.stack);

        // Send detailed error response
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            details: error.toString()
        });
    }
};

// Get all chat groups for a user
exports.getUserGroups = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Use the chat service to get user groups
        const groups = await chatService.getUserGroups(userId);

        res.status(200).json({
            success: true,
            data: groups
        });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user groups',
            error: error.message
        });
    }
};

// Create a new chat group
exports.createGroup = async (req, res) => {
    try {
        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to create a group
        const newGroup = await chatService.createGroup(req.body, req.file, io);

        res.status(201).json({
            success: true,
            data: newGroup
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating group',
            error: error.message
        });
    }
};

// Get messages for a group
exports.getGroupMessages = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Use the chat service to get group messages
        const groupData = await chatService.getGroupMessages(groupId, userId);

        res.status(200).json({
            success: true,
            data: groupData
        });
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching group messages',
            error: error.message
        });
    }
};

// Send a message to a group
exports.sendGroupMessage = async (req, res) => {
    try {
        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to send a group message
        const responseMessage = await chatService.sendGroupMessage(req.body, req.file, io);

        res.status(201).json({
            success: true,
            data: responseMessage
        });
    } catch (error) {
        console.error('Error sending group message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending group message',
            error: error.message
        });
    }
};

// Get all contacts (users)
exports.getContacts = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Use the chat service to get contacts
        const contacts = await chatService.getContacts(userId);

        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
};

// Add user to group
exports.addUserToGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to add user to group
        const updatedGroup = await chatService.addUserToGroup(groupId, userId, io);

        res.status(200).json({
            success: true,
            data: updatedGroup
        });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding user to group',
            error: error.message
        });
    }
};

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to remove user from group
        const updatedGroup = await chatService.removeUserFromGroup(groupId, userId, io);

        res.status(200).json({
            success: true,
            data: updatedGroup
        });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing user from group',
            error: error.message
        });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to delete the message
        const success = await chatService.deleteMessage(messageId, io);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};

// Delete a group message
exports.deleteGroupMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to delete the group message
        const success = await chatService.deleteGroupMessage(messageId, io);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting group message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting group message',
            error: error.message
        });
    }
};

// Update a message
exports.updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { message } = req.body;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to update the message
        const updatedMessage = await chatService.updateMessage(messageId, message, io);

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating message',
            error: error.message
        });
    }
};

// Update a group message
exports.updateGroupMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { message } = req.body;

        // Get the io instance
        const io = req.app.get('io');

        // Use the chat service to update the group message
        const updatedMessage = await chatService.updateGroupMessage(messageId, message, io);

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Group message updated successfully',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Error updating group message:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating group message',
            error: error.message
        });
    }
};
