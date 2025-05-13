import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as chatClient from './chatClient.js';

const ChatFloatingButton = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    // Get current user from localStorage
    useEffect(() => {
        const fetchUser = async () => {
            const userString = localStorage.getItem('user');
            let user = userString ? JSON.parse(userString) : null;

            if (!user) {
                const userInfoString = localStorage.getItem('userInfo');
                const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
                user = userInfo?.user || userInfo;
            }

            if (user && user._id) {
                setCurrentUser(user);
                // Connect to socket
                chatClient.connectSocket(user._id);
                // Start listening for new messages
                setupMessageListeners(user._id);
            }
        };

        fetchUser();
    }, []);

    // Setup message listeners
    const setupMessageListeners = (userId) => {
        // Listen for new direct messages
        chatClient.onNewMessage(() => {
            updateUnreadCount(userId);
        });

        // Listen for new group messages
        chatClient.onNewGroupMessage(() => {
            updateUnreadCount(userId);
        });

        // Initial count
        updateUnreadCount(userId);
    };

    // Update unread count
    const updateUnreadCount = async (userId) => {
        try {
            // Get user chats
            const chatsResponse = await chatClient.getUserChats(userId);
            if (chatsResponse && Array.isArray(chatsResponse)) {
                const directUnread = chatsResponse.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

                // Get user groups
                const groupsResponse = await chatClient.getUserGroups(userId);
                if (groupsResponse && Array.isArray(groupsResponse)) {
                    const groupUnread = groupsResponse.reduce((total, group) => total + (group.unreadCount || 0), 0);

                    // Set total unread count
                    setUnreadCount(directUnread + groupUnread);
                }
            }
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    };

    // Handle button click
    const handleClick = () => {
        navigate('/chat');
    };

    // Styles pour le bouton flottant
    const floatingButtonStyle = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4a6bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        zIndex: 1030,
        transition: 'all 0.3s ease',
        fontSize: '24px'
    };

    const unreadBadgeStyle = {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#dc3545',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
    };

    return (
        <div style={floatingButtonStyle} onClick={handleClick}>
            <i className="ri-chat-3-line"></i>
            {unreadCount > 0 && (
                <span style={unreadBadgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
        </div>
    );
};

export default ChatFloatingButton;
