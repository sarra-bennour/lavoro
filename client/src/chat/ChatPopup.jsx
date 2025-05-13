import React, { useState, useEffect, useRef } from 'react';
import * as chatClient from './chatClient.js';
import ChatWindow from './ChatWindow';
import ChatSidebar from './ChatSidebar';

const ChatPopup = ({ onClose, currentUser, onCreateGroup }) => {
    const [expanded, setExpanded] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [contacts, setContacts] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const refreshIntervalRef = useRef(null);

    // Load user data when component mounts
    useEffect(() => {
        if (currentUser && currentUser._id) {
            loadUserData(currentUser._id);
            chatClient.connectSocket(currentUser._id);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [currentUser]);

    // Load user's conversations, groups, and contacts
    const loadUserData = async (userId) => {
        setIsLoading(true);
        try {
            // Load conversations
            const chatsResponse = await chatClient.getUserChats(userId);
            if (chatsResponse && Array.isArray(chatsResponse)) {
                setConversations(chatsResponse);

                // Set first conversation as active if there's no active chat
                if (chatsResponse.length > 0 && !activeChat) {
                    handleChatSelect(chatsResponse[0], 'direct');
                }
            }

            // Load groups
            const groupsResponse = await chatClient.getUserGroups(userId);
            if (groupsResponse && Array.isArray(groupsResponse)) {
                setGroups(groupsResponse);
            }

            // Load contacts
            const contactsResponse = await chatClient.getContacts(userId);
            if (contactsResponse && typeof contactsResponse === 'object') {
                setContacts(contactsResponse);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load messages for the active chat
    const loadMessages = async (showLoading = true) => {
        if (!activeChat) return;

        if (showLoading) {
            setIsLoading(true);
        }

        try {
            if (activeChat.type === 'direct') {
                const response = await chatClient.getConversation(
                    currentUser._id,
                    activeChat.user._id
                );
                if (response && response.messages) {
                    setMessages(response.messages);
                }
            } else if (activeChat.type === 'group') {
                const response = await chatClient.getGroupMessages(
                    activeChat._id,
                    currentUser._id
                );
                if (response && response.messages) {
                    setMessages(response.messages);
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    };

    // Set up message refresh interval when active chat changes
    useEffect(() => {
        if (activeChat && currentUser) {
            loadMessages();

            // Clear previous interval
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }

            // Set up a refresh interval to reload messages periodically
            refreshIntervalRef.current = setInterval(() => {
                if (activeChat) {
                    loadMessages(false); // Don't show loading indicator
                }
            }, 5000); // Refresh every 5 seconds
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [activeChat, currentUser]);

    // Handle sending a message
    const handleSendMessage = async (message, attachment = null) => {
        try {
            if (!activeChat) return;

            const messageText = message || '';

            if (messageText.trim() === '' && !attachment) {
                return;
            }

            const finalMessage = messageText.trim() === '' && attachment ? 'Pièce jointe' : messageText;

            if (activeChat.type === 'direct') {
                const messageData = {
                    sender_id: currentUser._id,
                    receiver_id: activeChat.user._id,
                    message: finalMessage
                };

                if (attachment) {
                    try {
                        const response = await chatClient.sendMessage(messageData, attachment);

                        if (response && response.success && response.data) {
                            setMessages(prevMessages => [...prevMessages, response.data]);
                        }
                    } catch (error) {
                        console.error('Failed to send message with attachment:', error);
                        chatClient.emitPrivateMessage(messageData);
                    }
                } else {
                    chatClient.emitPrivateMessage(messageData);
                }
            } else if (activeChat.type === 'group') {
                const messageData = {
                    group_id: activeChat._id,
                    sender_id: currentUser._id,
                    message: finalMessage
                };

                if (attachment) {
                    try {
                        const response = await chatClient.sendGroupMessage(messageData, attachment);

                        if (response && response.success && response.data) {
                            setMessages(prevMessages => [...prevMessages, response.data]);
                        }
                    } catch (error) {
                        console.error('Failed to send group message with attachment:', error);
                        chatClient.emitGroupMessage(messageData);
                    }
                } else {
                    chatClient.emitGroupMessage(messageData);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Handle chat selection
    const handleChatSelect = (chat, type) => {
        setActiveChat({ ...chat, type });

        // Mark messages as read
        if (type === 'direct') {
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.user._id === chat.user._id) {
                        return { ...conv, unreadCount: 0 };
                    }
                    return conv;
                });
            });
        } else if (type === 'group') {
            setGroups(prevGroups => {
                return prevGroups.map(group => {
                    if (group._id === chat._id) {
                        return { ...group, unreadCount: 0 };
                    }
                    return group;
                });
            });
        }
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter conversations, groups, and contacts based on search query
    const filteredConversations = conversations.filter(conv => {
        return conv && conv.user && typeof conv.user.name === 'string' &&
            conv.user.name.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

    const filteredGroups = groups.filter(group => {
        return group && typeof group.name === 'string' &&
            group.name.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

    const filteredContacts = {};
    Object.keys(contacts || {}).forEach(letter => {
        if (contacts[letter] && Array.isArray(contacts[letter])) {
            const filteredLetterContacts = contacts[letter].filter(contact => {
                return contact && typeof contact.name === 'string' &&
                    contact.name.toLowerCase().includes((searchQuery || '').toLowerCase());
            });
            if (filteredLetterContacts.length > 0) {
                filteredContacts[letter] = filteredLetterContacts;
            }
        }
    });

    // Toggle expanded mode
    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    // Styles pour le popup de chat
    const chatPopupStyle = {
        position: 'fixed',
        bottom: expanded ? '50%' : '20px',
        right: expanded ? '50%' : '20px',
        transform: expanded ? 'translate(50%, 50%)' : 'none',
        width: expanded ? '90%' : '320px',
        height: expanded ? '80vh' : '500px',
        backgroundColor: '#1e2329',
        borderRadius: '12px',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1040,
        transition: 'all 0.3s ease',
        maxWidth: expanded ? '1200px' : '320px'
    };

    const chatPopupHeaderStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        borderBottom: '1px solid #2c3034',
        backgroundColor: '#252a30',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
    };

    const chatPopupContentStyle = {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
    };

    const chatPopupSidebarStyle = {
        width: '280px',
        borderRight: '1px solid #2c3034',
        backgroundColor: '#1e2329',
        overflow: 'hidden'
    };

    const chatPopupMainStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%'
    };

    const welcomeChatContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
        backgroundColor: '#1e2329',
        color: '#fff'
    };

    const welcomeChatIconStyle = {
        fontSize: '60px',
        color: '#4a6bff',
        marginBottom: '20px'
    };

    const welcomeChatTitleStyle = {
        fontSize: '24px',
        fontWeight: 600,
        marginBottom: '10px',
        color: '#fff'
    };

    const welcomeChatSubtitleStyle = {
        fontSize: '16px',
        color: '#adb5bd',
        marginBottom: '30px',
        textAlign: 'center'
    };

    const welcomeChatFeaturesStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '20px'
    };

    const welcomeFeatureStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#252a30',
        padding: '15px',
        borderRadius: '8px',
        width: '120px'
    };

    const featureIconStyle = {
        fontSize: '24px',
        color: '#4a6bff'
    };

    return (
        <div style={chatPopupStyle}>
            <div style={chatPopupHeaderStyle}>
                <h5 style={{ margin: 0, color: '#fff' }}>Messagerie</h5>
                <div>
                    <button className="btn btn-sm btn-icon btn-primary-light me-1" onClick={toggleExpanded}>
                        <i className={`ri-${expanded ? 'contract' : 'expand'}-left-right-line`}></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-danger" onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>
            <div style={chatPopupContentStyle}>
                {expanded && (
                    <div style={chatPopupSidebarStyle}>
                        <ChatSidebar
                            conversations={filteredConversations}
                            groups={filteredGroups}
                            contacts={filteredContacts}
                            activeChat={activeChat}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onChatSelect={handleChatSelect}
                            searchQuery={searchQuery}
                            onSearch={handleSearch}
                            currentUser={currentUser}
                            onCreateGroup={onCreateGroup}
                        />
                    </div>
                )}
                <div style={chatPopupMainStyle}>
                    {activeChat ? (
                        <ChatWindow
                            chat={activeChat}
                            messages={messages}
                            currentUser={currentUser}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={welcomeChatContainerStyle}>
                                <div style={welcomeChatIconStyle}>
                                    <i className="ri-chat-smile-3-line"></i>
                                </div>
                                <h4 style={welcomeChatTitleStyle}>Bienvenue dans votre espace de discussion!</h4>
                                <p style={welcomeChatSubtitleStyle}>Sélectionnez une conversation dans la liste pour commencer à échanger</p>
                                <div style={welcomeChatFeaturesStyle}>
                                    <div style={welcomeFeatureStyle}>
                                        <i className="ri-message-2-line" style={featureIconStyle}></i>
                                        <span style={{ color: '#e9ecef' }}>Messages instantanés</span>
                                    </div>
                                    <div style={welcomeFeatureStyle}>
                                        <i className="ri-group-line" style={featureIconStyle}></i>
                                        <span style={{ color: '#e9ecef' }}>Discussions de groupe</span>
                                    </div>
                                    <div style={welcomeFeatureStyle}>
                                        <i className="ri-attachment-2" style={featureIconStyle}></i>
                                        <span style={{ color: '#e9ecef' }}>Partage de fichiers</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPopup;
