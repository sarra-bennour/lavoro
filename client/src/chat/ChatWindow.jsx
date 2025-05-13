import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as chatClient from './chatClient.js';
import EmojiPicker from 'emoji-picker-react';

// API URL for file uploads
const API_URL = 'https://lavoro-back.onrender.com';

const ChatWindow = ({ chat = {}, messages = [], currentUser = {}, onSendMessage, isLoading = false }) => {
    // Vérifier si l'objet chat est correctement initialisé
    if (!chat || typeof chat !== 'object') {
        console.error('Chat object is not properly initialized:', chat);
        chat = { type: 'direct', user: {}, name: 'Conversation' };
    }
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const chatContentRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const messageInputRef = useRef(null);
    const editInputRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }, [messages]);

    // Force re-render when edited messages change
    useEffect(() => {
        // This effect will run on component mount and when messages change
        // It ensures that any locally edited messages are applied

        // Create a unique key for this chat to track if we've already processed it
        const chatKey = `chat_processed_${chat.type}_${chat.type === 'direct' ? chat.user?._id : chat._id}`;

        // Check if we've already processed this chat in this session
        if (!sessionStorage.getItem(chatKey) && messages.length > 0) {
            console.log("First load of this chat, checking for locally edited messages");

            // Look for any edited messages for this chat
            let hasEditedMessages = false;

            messages.forEach(message => {
                if (message && message._id) {
                    const storageKey = `edited_message_${message._id}`;
                    if (localStorage.getItem(storageKey)) {
                        hasEditedMessages = true;
                    }
                }
            });

            // If we found edited messages, force a re-render by updating the messages
            if (hasEditedMessages && typeof onSendMessage === 'function') {
                console.log("Found locally edited messages, forcing re-render");

                // Use setTimeout to avoid state update during render
                setTimeout(() => {
                    // This will trigger the groupMessagesByDate function which applies the edits
                    onSendMessage(null, null, [...messages]);
                }, 100);
            }

            // Mark this chat as processed
            sessionStorage.setItem(chatKey, 'true');
        }
    }, [chat, messages, onSendMessage]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        setMessageText(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Toggle emoji picker
    const toggleEmojiPicker = () => {
        setShowEmojiPicker(prev => !prev);
    };

    // Format timestamp to time (e.g., "14:30")
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return format(new Date(timestamp), 'HH:mm', { locale: fr });
    };

    // Handle edit message
    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setEditText(message.message);

        // Focus the edit input after a short delay to ensure it's rendered
        setTimeout(() => {
            if (editInputRef.current) {
                editInputRef.current.focus();
            }
        }, 100);
    };

    // Handle save edited message
    const handleSaveEdit = async () => {
        if (!editingMessage || editText.trim() === '') return;

        try {
            console.log("Saving edited message:", {
                messageId: editingMessage._id,
                oldText: editingMessage.message,
                newText: editText,
                chatType: chat.type
            });

            // Create a copy of the edited message with updated content
            const updatedMessage = {
                ...editingMessage,
                message: editText,
                edited: true,
                edited_at: new Date().toISOString()
            };

            // Update the message in the local state immediately
            const updatedMessages = messages.map(msg =>
                msg._id === editingMessage._id ? updatedMessage : msg
            );

            // Log the updated messages array
            console.log("Updated messages array:", updatedMessages.map(m => ({
                id: m._id,
                message: m.message,
                sender: m.sender ? m.sender.name : 'Unknown'
            })));

            // Update the messages state through the parent component
            if (typeof onSendMessage === 'function') {
                console.log("Calling onSendMessage with updated messages");
                onSendMessage(null, null, updatedMessages);
            }

            // Store the updated message in localStorage to ensure persistence
            const storageKey = `edited_message_${editingMessage._id}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedMessage));
            console.log("Saved edited message to localStorage:", storageKey);

            // Now handle the API updates based on chat type
            if (chat.type === 'direct') {
                // Use socket.io to update the message
                chatClient.emitUpdateMessage({
                    message_id: editingMessage._id,
                    new_message: editText
                });
            } else if (chat.type === 'group') {
                try {
                    // Use both direct API call and socket.io for redundancy
                    console.log("Updating group message with ID:", editingMessage._id, "New message:", editText);

                    // Direct API call to update the message
                    const apiResponse = await chatClient.updateGroupMessage(editingMessage._id, editText);
                    console.log("API response for group message update:", apiResponse);

                    // Also emit socket event for real-time updates to other users
                    chatClient.emitUpdateGroupMessage({
                        message_id: editingMessage._id,
                        new_message: editText,
                        group_id: chat._id
                    });

                    console.log("Group message update requests sent");
                } catch (error) {
                    console.error("Error in API/socket update for group message:", error);
                    // Even if these fail, the UI is already updated
                }
            }
        } catch (error) {
            console.error('Error in handleSaveEdit:', error);
            // Even if there's an error, we don't revert the UI change
            alert("Votre message a été modifié localement, mais il pourrait y avoir un problème de synchronisation avec le serveur.");
        } finally {
            // Reset editing state
            setEditingMessage(null);
            setEditText('');
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    // Handle delete message
    const handleDeleteMessage = async (message) => {
        // Suppression de la confirmation window.confirm
        try {
            console.log("Deleting message:", message._id);

            // Remove the message from the UI immediately
            const updatedMessages = messages.filter(msg => msg._id !== message._id);

            // Update the messages state through the parent component
            if (typeof onSendMessage === 'function') {
                onSendMessage(null, null, updatedMessages);
            }

            // Also remove any locally stored edited version of this message
            const storageKey = `edited_message_${message._id}`;
            localStorage.removeItem(storageKey);
            console.log("Removed locally stored message:", storageKey);

            // Then send the delete request to the server
            if (chat.type === 'direct') {
                // Delete direct message
                await chatClient.deleteMessage(message._id);
                console.log("Direct message deleted on server");
            } else if (chat.type === 'group') {
                // Delete group message
                await chatClient.deleteGroupMessage(message._id);
                console.log("Group message deleted on server");
            }
        } catch (error) {
            console.error('Error deleting message:', error);

            // If there was an error, we don't restore the message to keep the UI consistent
            // Instead, we'll just log the error and continue
            console.log("Message was removed from UI but there was an error with the server request");
        }
    };

    // Handle message input change
    const handleMessageChange = (e) => {
        setMessageText(e.target.value);

        // Emit typing event
        if (chat.type === 'direct') {
            if (!isTyping) {
                setIsTyping(true);
                chatClient.emitTyping({
                    sender_id: currentUser._id,
                    receiver_id: chat.user._id
                });
            }

            // Clear previous timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Set new timeout to stop typing indicator after 2 seconds
            const timeout = setTimeout(() => {
                setIsTyping(false);
                chatClient.emitStopTyping({
                    sender_id: currentUser._id,
                    receiver_id: chat.user._id
                });
            }, 2000);

            setTypingTimeout(timeout);
        }
    };

    // Handle file attachment
    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (max 19MB)
            const maxSize = 19 * 1024 * 1024; // 19MB in bytes
            if (file.size > maxSize) {
                alert(`Le fichier est trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)} MB). La taille maximale est de 19 MB.`);
                e.target.value = ''; // Reset file input
                return;
            }

            // Check file type
            const acceptedTypes = [
                'image/', 'video/', 'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'application/zip', 'application/x-rar-compressed'
            ];

            const isAccepted = acceptedTypes.some(type => file.type.startsWith(type));
            if (!isAccepted) {
                alert(`Type de fichier non pris en charge: ${file.type}. Veuillez sélectionner une image, une vidéo, un PDF, un document Word/Excel, un fichier texte ou une archive.`);
                e.target.value = ''; // Reset file input
                return;
            }

            console.log('File selected:', file.name, 'Type:', file.type, 'Size:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
            setAttachment(file);
        }
    };

    // Handle message submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Don't send if there's no message and no attachment
        if (messageText.trim() === '' && !attachment) {
            console.log('No message or attachment to send');
            return;
        }

        console.log('Submitting message:', messageText.trim() || '(empty)', 'with attachment:', attachment ? attachment.name : 'none');

        // Send message with or without attachment
        onSendMessage(messageText, attachment);

        // Reset form
        setMessageText('');
        setAttachment(null);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Focus the input field for the next message
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    };

    // Group messages by date with additional validation
    const groupMessagesByDate = () => {
        const groups = {};

        if (!Array.isArray(messages)) {
            console.error("Messages is not an array:", messages);
            return groups;
        }

        // Apply any locally edited messages from localStorage
        const processedMessages = messages.map(message => {
            if (!message || !message._id) {
                console.warn("Invalid message found in messages array:", message);
                return message;
            }

            // Check if this message has a locally stored edit
            const storageKey = `edited_message_${message._id}`;
            const storedEditedMessage = localStorage.getItem(storageKey);

            if (storedEditedMessage) {
                try {
                    const editedMessage = JSON.parse(storedEditedMessage);
                    console.log(`Found locally edited message ${message._id}:`, {
                        original: message.message,
                        edited: editedMessage.message
                    });

                    // Merge the stored edit with the original message to preserve all properties
                    return {
                        ...message,
                        message: editedMessage.message,
                        edited: true,
                        edited_at: editedMessage.edited_at || new Date().toISOString()
                    };
                } catch (error) {
                    console.error("Error parsing stored edited message:", error);
                    return message;
                }
            }

            return message;
        });

        // Process the messages (with applied edits) into date groups
        processedMessages.forEach(message => {
            if (!message) {
                console.warn("Undefined message found in messages array");
                return;
            }

            if (!message.sent_at) {
                console.warn("Message without sent_at found:", message);
                // Ajouter une date par défaut
                message.sent_at = new Date().toISOString();
            }

            try {
                const date = new Date(message.sent_at).toLocaleDateString('fr-FR');
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(message);
            } catch (error) {
                console.error("Error processing message date:", error, message);
            }
        });

        console.log("Grouped messages by date:", Object.keys(groups).map(date => ({
            date,
            messageCount: groups[date].length
        })));

        return groups;
    };

    const messageGroups = groupMessagesByDate();

    // Get chat name and image with proper error handling
    const chatName = chat.type === 'direct'
        ? (chat.user && chat.user.name
            ? chat.user.name
            : (chat.user && (chat.user.firstName || chat.user.lastName)
                ? `${chat.user.firstName || ''} ${chat.user.lastName || ''}`.trim()
                : 'Utilisateur'))
        : (chat.name || 'Groupe');

    const chatImage = chat.type === 'direct'
        ? (chat.user && chat.user.profileImage
            ? (chat.user.profileImage.startsWith('http')
                ? chat.user.profileImage
                : `${API_URL}/${chat.user.profileImage.replace(/^\//, '')}`)
            : (chat.user && chat.user.image
                ? (chat.user.image.startsWith('http')
                    ? chat.user.image
                    : `${API_URL}/${chat.user.image.replace(/^\//, '')}`)
                : "../assets/images/faces/6.jpg"))
        : (chat.avatar
            ? (chat.avatar.startsWith('http')
                ? chat.avatar
                : `${API_URL}/${chat.avatar.replace(/^\//, '')}`)
            : "../assets/images/faces/17.jpg");

    const chatStatus = chat.type === 'direct'
        ? (chat.user && chat.user.status ? chat.user.status : 'offline')
        : '';

    // Always use light mode
    const isDarkMode = false;

    // Light mode styles (not actually used since we're setting isDarkMode to false)
    const darkModeStyles = {
        backgroundColor: '#ffffff',
        color: '#212529',
        borderColor: '#dee2e6'
    };

    return (
        <div className="chat-window border d-flex flex-column" style={{
            backgroundColor: '#ffffff',
            color: '#212529',
            borderColor: '#dee2e6'
        }}>
            {/* Chat Header - Improved design */}
            <div className="chat-header" style={{
                backgroundColor: '#ffffff',
                color: '#212529',
                borderBottom: '1px solid #e9ecef',
                padding: '15px 20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                zIndex: 10
            }}>
                <div className="d-flex align-items-center">
                    <span className={`avatar avatar-md ${chatStatus} me-3`}>
                        <img className="chatimageperson" src={chatImage} alt={chatName} style={{
                            objectFit: 'cover',
                            boxShadow: '0 2px 5px rgba(255, 255, 255, 0.1)'
                        }} />
                    </span>
                    <div>
                        <p className="mb-0 fw-semibold chatnameperson" style={{
                            fontSize: '1.2rem',
                            color: isDarkMode ? '#ffffff' : 'inherit',
                            fontWeight: 'bold',
                            textShadow: isDarkMode ? '0 1px 2px rgba(255, 255, 255, 0.2)' : 'none'
                        }}>
                            {chatName || 'Conversation'}
                            {/* Débogage - à supprimer en production */}
                            {console.log('Chat info:', {
                                chatName,
                                chatType: chat.type,
                                chatUser: chat.user,
                                chatId: chat._id
                            })}
                        </p>
                        {chat.type === 'direct' && (
                            <p className="mb-0 fs-12 chatpersonstatus" style={{
                                color: chatStatus === 'online'
                                    ? (isDarkMode ? '#4ade80' : '#28a745')
                                    : (isDarkMode ? '#d1d5db' : '#6c757d'),
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: chatStatus === 'online'
                                        ? (isDarkMode ? '#4ade80' : '#28a745')
                                        : (isDarkMode ? '#d1d5db' : '#6c757d')
                                }}></span>
                                {chatStatus === 'online' ? 'En ligne' : 'Hors ligne'}
                            </p>
                        )}
                        {chat.type === 'group' && (
                            <p className="mb-0 fs-12" style={{
                                color: isDarkMode ? '#d1d5db' : '#6c757d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <i className="ri-group-line" style={{ fontSize: '14px' }}></i>
                                {chat.members?.length || 0} membres
                            </p>
                        )}
                    </div>
                </div>
                <div className="d-flex align-items-center">
                    {/* Bouton de fermeture pour la version mobile uniquement */}
                    <button className="btn btn-sm btn-icon btn-primary-light me-2 d-lg-none responsive-chat-close" style={{
                        backgroundColor: 'rgba(var(--bs-danger-rgb), 0.1)',
                        color: 'var(--bs-danger)',
                        border: 'none'
                    }}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* Chat Content */}
            <div className="chat-content flex-grow-1" id="main-chat-content" ref={chatContentRef} style={isDarkMode ? darkModeStyles : {}}>
                {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                ) : (
                    <ul className="list-unstyled">
                        {Object.keys(messageGroups).map(date => (
                            <React.Fragment key={date}>
                                <li className="chat-day-label">
                                    <div className="text-center my-3">
                                        <span className="date-label px-3 py-1">{date === new Date().toLocaleDateString('fr-FR') ? "Aujourd'hui" : date}</span>
                                    </div>
                                </li>
                                {messageGroups[date].map((message, index) => {
                                    // Gérer le cas où sender_id est un objet avec une propriété _id
                                    const senderId = typeof message.sender_id === 'object' && message.sender_id !== null && message.sender_id._id
                                        ? message.sender_id._id
                                        : message.sender_id;
                                    const currentUserId = currentUser._id;
                                    const isCurrentUser = senderId === currentUserId;

                                    // Log détaillé pour débogage
                                    console.log(`Message ${index}:`, {
                                        message: message.message,
                                        senderId: senderId,
                                        currentUserId: currentUserId,
                                        isCurrentUser: isCurrentUser,
                                        sender: message.sender,
                                        fullMessage: message
                                    });

                                    return (
                                        <li key={index} className={isCurrentUser ? "chat-item-end" : "chat-item-start"} style={{
                                            display: 'flex',
                                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                                            width: '100%',
                                            marginBottom: '20px'  /* Augmentation de l'espacement entre les messages */
                                        }}>
                                           <div className="chat-list-inner" style={{
                                               maxWidth: '500px',  /* Augmentation de la largeur maximale */
                                               display: 'flex',
                                               flexDirection: isCurrentUser ? 'row-reverse' : 'row'
                                           }}>  {/* Largeur fixe augmentée */}
                                                {/* Afficher l'avatar pour tous les messages dans les groupes, ou seulement pour les autres utilisateurs dans les conversations directes */}
                                                {(chat.type === 'group' || !isCurrentUser) && (
                                                    <div className="chat-user-profile">
                                                        <span className={`avatar avatar-md ${chat.type === 'direct' ? chatStatus : ''}`}>
                                                             <img
                                                                src={chat.type === 'direct'
                                                                    ? chatImage
                                                                    : isCurrentUser
                                                                        ? (currentUser.profileImage
                                                                            ? (currentUser.profileImage.startsWith('http')
                                                                                ? currentUser.profileImage
                                                                                : `${API_URL}/${currentUser.profileImage.replace(/^\//, '')}`)
                                                                            : currentUser.image
                                                                                ? (currentUser.image.startsWith('http')
                                                                                    ? currentUser.image
                                                                                    : `${API_URL}/${currentUser.image.replace(/^\//, '')}`)
                                                                                : "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name || currentUser.firstName || 'User') + "&background=4a6bff&color=fff")
                                                                        : (message.sender?.profileImage
                                                                            ? (message.sender.profileImage.startsWith('http')
                                                                                ? message.sender.profileImage
                                                                                : `${API_URL}/${message.sender.profileImage.replace(/^\//, '')}`)
                                                                            : message.sender?.image
                                                                                ? (message.sender.image.startsWith('http')
                                                                                    ? message.sender.image
                                                                                    : `${API_URL}/${message.sender.image.replace(/^\//, '')}`)
                                                                                : "https://ui-avatars.com/api/?name=" + encodeURIComponent(message.sender?.name || message.sender?.firstName || 'User') + "&background=4a6bff&color=fff")}
                                                                alt={chat.type === 'direct' ?
                                                                    chatName :
                                                                    isCurrentUser
                                                                        ? 'Moi'
                                                                        : (message.sender?.name ||
                                                                           `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
                                                                           'Utilisateur')}
                                                            />

                                                        </span>
                                                    </div>
                                                )}
                                                <div className={isCurrentUser ? "me-3" : "ms-3"} style={{
                                                    textAlign: isCurrentUser ? 'right' : 'left',
                                                    width: '100%'
                                                }}>
                                                    <div className="main-chat-msg" style={{
                                                        backgroundColor: isDarkMode
                                                            ? (isCurrentUser ? 'rgba(13, 110, 253, 0.2)' : '#212529')
                                                            : (isCurrentUser ? '#4a6bff' : '#f1f3f5'),
                                                        color: isDarkMode
                                                            ? '#dee2e6'
                                                            : (isCurrentUser ? 'white' : '#333'),
                                                        marginLeft: isCurrentUser ? 'auto' : '0',
                                                        marginRight: isCurrentUser ? '0' : 'auto',
                                                        padding: '12px 16px',  /* Padding augmenté */
                                                        borderRadius: '18px',  /* Coins plus arrondis */
                                                        minWidth: '120px',     /* Largeur minimale pour les courts messages */
                                                        boxShadow: isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 1px 2px rgba(0,0,0,0.1)',  /* Ombre adaptée */
                                                        borderColor: isDarkMode ? '#495057' : 'transparent',
                                                        borderWidth: isDarkMode ? '1px' : '0',
                                                        borderStyle: 'solid'
                                                    }}>
                                                        {chat.type === 'group' && (
                                                            <div className="sender-name mb-1 fw-bold" style={{
                                                                color: isCurrentUser ? '#28a745' : '#4a6bff',
                                                                textAlign: isCurrentUser ? 'right' : 'left',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {isCurrentUser ? 'Moi' :
                                                                 (message.sender?.name ||
                                                                 `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
                                                                 'Utilisateur')}
                                                            </div>
                                                        )}
                                                        {/* Debug info - remove in production */}
                                                        {chat.type === 'group' && (
                                                            <div style={{ display: 'none' }}>
                                                                {console.log('Message sender:', message.sender, 'isCurrentUser:', isCurrentUser)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            {editingMessage && editingMessage._id === message._id ? (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '10px',
                                                                    width: '100%'
                                                                }}>
                                                                    <textarea
                                                                        ref={editInputRef}
                                                                        value={editText}
                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                        rows={3}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #4a6bff',
                                                                            backgroundColor: '#252a30',
                                                                            color: '#fff',
                                                                            resize: 'vertical'
                                                                        }}
                                                                    />
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'flex-end',
                                                                        gap: '10px'
                                                                    }}>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                backgroundColor: '#6c757d',
                                                                                color: 'white',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={handleSaveEdit}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                backgroundColor: '#4a6bff',
                                                                                color: 'white',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* Message actions (only show for current user's messages) */}
                                                                    {isCurrentUser && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '-20px',
                                                                            right: '0',
                                                                            display: 'flex',
                                                                            gap: '5px',
                                                                            opacity: '0',
                                                                            transition: 'opacity 0.2s ease',
                                                                            zIndex: '10'
                                                                        }}
                                                                        className="hover-visible">
                                                                            <button
                                                                                style={{
                                                                                    background: '#4a6bff',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '50%',
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '12px'
                                                                                }}
                                                                                onClick={() => handleEditMessage(message)}
                                                                            >
                                                                                <i className="ri-edit-line"></i>
                                                                            </button>
                                                                            <button
                                                                                style={{
                                                                                    background: '#dc3545',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '50%',
                                                                                    width: '24px',
                                                                                    height: '24px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '12px'
                                                                                }}
                                                                                onClick={() => handleDeleteMessage(message)}
                                                                            >
                                                                                <i className="ri-delete-bin-line"></i>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                          <p className="mb-0" style={{
    fontSize: '1rem',  /* Taille de police légèrement augmentée */
    lineHeight: '1.5',  /* Interligne confortable */
    margin: '0 0 4px 0', /* Marge basse légèrement augmentée */
    maxWidth: '100%',     /* Largeur maximale */
    overflowWrap: 'break-word',
    hyphens: 'auto',
    wordBreak: 'break-word', /* Gestion des mots longs */
    textAlign: isCurrentUser ? 'right' : 'left', /* Alignement du texte */
    padding: '2px 0',  /* Ajout d'un peu de padding vertical */
    color: isDarkMode ? '#dee2e6' : 'inherit'  /* Couleur adaptée au mode nuit */
}}>
    {message.message}
</p>
{message.edited && (
    <div style={{
        fontSize: '0.8rem',    /* Plus petit */
        color: isDarkMode
            ? (isCurrentUser ? 'rgba(255,255,255,0.7)' : '#adb5bd')
            : (isCurrentUser ? 'rgba(255,255,255,0.65)' : '#adb5bd'), /* Adapté au thème et au mode */
        marginTop: '2px',      /* Espacement réduit */
        fontStyle: 'italic',
        lineHeight: '1.2',     /* Interligne serré */
        textAlign: isCurrentUser ? 'right' : 'left' /* Alignement du texte */
    }}>
        (modifié {message.edited_at ? format(new Date(message.edited_at), 'HH:mm', { locale: fr }) : ''})
    </div>
)}
                                                                </>
                                                            )}
                                                            {message.attachment && (
                                                                <div className="chat-attachment mt-2">
                                                                    {message.attachment_type === 'image' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="glightbox" data-gallery="chat-gallery">
                                                                            <img src={`${API_URL}/uploads/chat/${message.attachment}`} alt="attachment" className="img-fluid rounded" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                                                                        </a>
                                                                    ) : message.attachment_type === 'video' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="glightbox" data-gallery="chat-gallery">
                                                                            <video src={`${API_URL}/uploads/chat/${message.attachment}`} className="img-fluid rounded" controls style={{ maxWidth: '200px' }}></video>
                                                                        </a>
                                                                    ) : message.attachment_type === 'pdf' ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-pdf-line fs-24 text-danger me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment_type === 'word' || message.attachment.endsWith('.doc') || message.attachment.endsWith('.docx') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-word-line fs-24 text-primary me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment_type === 'excel' || message.attachment.endsWith('.xls') || message.attachment.endsWith('.xlsx') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-excel-line fs-24 text-success me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : message.attachment.endsWith('.zip') || message.attachment.endsWith('.rar') ? (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-zip-line fs-24 text-warning me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <a href={`${API_URL}/uploads/chat/${message.attachment}`} className="chat-file-attachment p-2 border rounded d-inline-block" download>
                                                                            <div className="d-flex align-items-center">
                                                                                <i className="ri-file-line fs-24 text-muted me-2"></i>
                                                                                <div>
                                                                                    <span className="d-block">{message.attachment.split('-').pop()}</span>
                                                                                    <small className="text-muted">Cliquez pour télécharger</small>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="chatting-user-info" style={{
                                                        textAlign: isCurrentUser ? 'right' : 'left',
                                                        display: 'block',
                                                        fontSize: '0.8rem',
                                                        color: isDarkMode ? '#adb5bd' : '#6c757d',
                                                        marginTop: '4px'
                                                    }}>
                                                        <span className="msg-sent-time">{formatTime(message.sent_at)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        {messages.length === 0 && (
                            <li className="text-center p-5">
                                <p className="text-muted">Aucun message. Commencez la conversation!</p>
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* Zone de saisie de message (améliorée) */}
            <div className="chat-message-input-container mt-auto" style={{
                padding: '15px 20px',
                width: '100%',
                boxSizing: 'border-box',
                ...(isDarkMode ? darkModeStyles : {})
            }}>
                <form onSubmit={handleSubmit} className="chat-message-form" style={{
                    display: 'flex',
                    width: '100%',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip,application/x-rar-compressed"
                    />
                    <button
                        type="button"
                        className="btn btn-primary1-light btn-icon chat-message-button attachment-btn"
                        onClick={handleAttachmentClick}
                        style={{
                            backgroundColor: isDarkMode ? '#212529' : 'rgba(var(--bs-primary-rgb), 0.1)',
                            color: isDarkMode ? '#dee2e6' : 'var(--bs-primary)',
                            border: isDarkMode ? '1px solid #495057' : 'none',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            flexShrink: 0
                        }}
                        title="Joindre un fichier"
                    >
                        <i className="ri-attachment-2" style={{ fontSize: '18px' }}></i>
                    </button>
                    <div className="position-relative">
                        <button
                            type="button"
                            className="btn btn-icon btn-primary2 emoji-picker chat-message-button"
                            onClick={toggleEmojiPicker}
                            style={{
                                backgroundColor: isDarkMode ? '#212529' : 'rgba(var(--bs-primary-rgb), 0.1)',
                                color: isDarkMode ? '#dee2e6' : 'var(--bs-primary)',
                                border: isDarkMode ? '1px solid #495057' : 'none',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                flexShrink: 0
                            }}
                            title="Ajouter un emoji"
                        >
                            <i className="ri-emotion-line" style={{ fontSize: '18px' }}></i>
                        </button>
                        {showEmojiPicker && (
                            <div
                                className="position-absolute bottom-100 start-0 mb-2"
                                style={{ zIndex: 1000 }}
                                ref={emojiPickerRef}
                            >
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    width={300}
                                    height={400}
                                    theme="auto"
                                />
                            </div>
                        )}
                    </div>
                    <input
                        className="form-control chat-message-space"
                        placeholder="Tapez votre message ici..."
                        type="text"
                        value={messageText}
                        onChange={handleMessageChange}
                        ref={messageInputRef}
                        style={{
                            flex: '1 1 auto',
                            minWidth: '300px',
                            width: '100%',
                            height: '45px',
                            fontSize: '1rem',
                            padding: '10px 15px',
                            backgroundColor: '#ffffff',
                            color: '#212529',
                            borderColor: '#dee2e6'
                        }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary btn-icon chat-message-button"
                        style={{
                            backgroundColor: isDarkMode ? '#0d6efd' : 'var(--bs-primary)',
                            color: 'white',
                            border: isDarkMode ? '1px solid #0d6efd' : 'none',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            flexShrink: 0
                        }}
                        title="Envoyer"
                    >
                        <i className="ri-send-plane-2-line" style={{ fontSize: '18px' }}></i>
                    </button>
                </form>
                {attachment && (
                    <div className="attachment-preview mt-3 p-3 border rounded" style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(var(--bs-primary-rgb), 0.03)',
                        borderColor: 'rgba(var(--bs-primary-rgb), 0.2)',
                        borderRadius: '0.75rem'
                    }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(var(--bs-primary-rgb), 0.1)',
                                    marginRight: '12px'
                                }}>
                                    {attachment.type.startsWith('image/') ? (
                                        <i className="ri-image-line fs-20 text-success"></i>
                                    ) : attachment.type.startsWith('video/') ? (
                                        <i className="ri-video-line fs-20 text-danger"></i>
                                    ) : attachment.type.includes('pdf') ? (
                                        <i className="ri-file-pdf-line fs-20 text-danger"></i>
                                    ) : attachment.type.includes('word') || attachment.type.includes('document') ? (
                                        <i className="ri-file-word-line fs-20 text-primary"></i>
                                    ) : attachment.type.includes('excel') || attachment.type.includes('sheet') ? (
                                        <i className="ri-file-excel-line fs-20 text-success"></i>
                                    ) : attachment.type.includes('zip') || attachment.type.includes('compressed') ? (
                                        <i className="ri-file-zip-line fs-20 text-warning"></i>
                                    ) : (
                                        <i className="ri-file-line fs-20 text-muted"></i>
                                    )}
                                </div>
                                <div>
                                    <span className="d-block fw-medium" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {attachment.name}
                                    </span>
                                    <small className="text-muted">{(attachment.size / 1024).toFixed(2)} KB</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon"
                                onClick={() => setAttachment(null)}
                                style={{
                                    backgroundColor: 'rgba(var(--bs-danger-rgb), 0.1)',
                                    color: 'var(--bs-danger)',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%'
                                }}
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default ChatWindow;