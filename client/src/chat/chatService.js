import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3000';
const socket = io(API_URL, {
    withCredentials: true,
    extraHeaders: {
        "my-custom-header": "abcd"
    }
});

// Create axios instance for chat API
const api = axios.create({
    baseURL: `${API_URL}/chat`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add authorization header to requests if token exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Socket.io connection management
export const connectSocket = (userId) => {
    socket.emit('user_connected', userId);
};

// Local storage functions for conversations
export const saveConversationsToLocalStorage = (userId, conversations) => {
    try {
        localStorage.setItem(`chat_conversations_${userId}`, JSON.stringify(conversations));
        console.log(`Saved ${conversations.length} conversations to localStorage for user ${userId}`);
    } catch (error) {
        console.error('Error saving conversations to localStorage:', error);
    }
};

export const getConversationsFromLocalStorage = (userId) => {
    try {
        const storedConversations = localStorage.getItem(`chat_conversations_${userId}`);
        if (storedConversations) {
            const conversations = JSON.parse(storedConversations);
            console.log(`Retrieved ${conversations.length} conversations from localStorage for user ${userId}`);
            return conversations;
        }
    } catch (error) {
        console.error('Error retrieving conversations from localStorage:', error);
    }
    return [];
};

// Local storage functions for groups
export const saveGroupsToLocalStorage = (userId, groups) => {
    try {
        localStorage.setItem(`chat_groups_${userId}`, JSON.stringify(groups));
        console.log(`Saved ${groups.length} groups to localStorage for user ${userId}`);
    } catch (error) {
        console.error('Error saving groups to localStorage:', error);
    }
};

export const getGroupsFromLocalStorage = (userId) => {
    try {
        const storedGroups = localStorage.getItem(`chat_groups_${userId}`);
        if (storedGroups) {
            const groups = JSON.parse(storedGroups);
            console.log(`Retrieved ${groups.length} groups from localStorage for user ${userId}`);
            return groups;
        }
    } catch (error) {
        console.error('Error retrieving groups from localStorage:', error);
    }
    return [];
};

// Direct Messages API
export const getUserChats = async (userId) => {
    try {
        console.log(`Fetching user chats for userId: ${userId}`);
        const response = await api.get(`/user/${userId}`);
        console.log('User chats response:', response.data);

        // Vérifier si la réponse est valide et contient des données
        if (response.data && response.data.success) {
            // S'assurer que les données sont un tableau
            if (!Array.isArray(response.data.data)) {
                console.warn('Response data is not an array, converting to empty array');
                response.data.data = [];
            }

            // S'assurer que chaque conversation a un lastMessage valide
            response.data.data = response.data.data.map(conv => {
                // Si lastMessage n'existe pas, créer un objet vide
                if (!conv.lastMessage) {
                    conv.lastMessage = {
                        message: "Démarrer une conversation...",
                        sent_at: new Date().toISOString(),
                        is_read: true
                    };
                }

                // S'assurer que l'utilisateur a un statut
                if (conv.user && !conv.user.status) {
                    conv.user.status = 'online';
                }

                // S'assurer que l'utilisateur a un nom
                if (conv.user && (!conv.user.name || conv.user.name.trim() === '')) {
                    conv.user.name = `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur';
                }

                // S'assurer que l'utilisateur a une image de profil
                if (conv.user && !conv.user.profileImage) {
                    const userName = conv.user.name || `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur';
                    conv.user.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4a6bff&color=fff`;
                }

                return conv;
            });
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching user chats:', error);
        // Au lieu de propager l'erreur, retournons un objet avec success: false
        // pour que le composant puisse gérer l'erreur plus gracieusement
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

export const getConversation = async (userId, otherUserId) => {
    try {
        console.log(`Fetching conversation between ${userId} and ${otherUserId}`);
        const response = await api.get(`/conversation/${userId}/${otherUserId}`);
        console.log('Conversation response:', response.data);

        // Vérifier si la réponse est valide et contient des données
        if (response.data && response.data.success && response.data.data && response.data.data.user) {
            const user = response.data.data.user;

            // S'assurer que l'utilisateur a un nom
            if (!user.name || user.name.trim() === '') {
                user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
            }

            // S'assurer que l'utilisateur a une image de profil
            if (!user.profileImage) {
                const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
                user.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4a6bff&color=fff`;
            }

            // S'assurer que l'utilisateur a un statut
            if (!user.status) {
                user.status = 'online';
            }

            console.log('Enhanced user data:', user);
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching conversation:', error);
        // Au lieu de propager l'erreur, retournons un objet avec success: false
        // pour que le composant puisse gérer l'erreur plus gracieusement
        return {
            success: false,
            error: error.message,
            data: { messages: [] }
        };
    }
};

export const sendMessage = async (messageData, attachment = null) => {
    try {
        // Ensure messageData has a message property
        if (!messageData.message) {
            messageData.message = attachment ? 'Pièce jointe' : '';
        }

        // If there's an attachment, use FormData
        if (attachment) {
            const formData = new FormData();
            formData.append('sender_id', messageData.sender_id);
            formData.append('receiver_id', messageData.receiver_id);
            formData.append('message', messageData.message); // This should now always have a value

            // Check file size
            const fileSizeInMB = attachment.size / (1024 * 1024);
            console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);

            if (fileSizeInMB > 19) {
                throw new Error(`File size (${fileSizeInMB.toFixed(2)} MB) exceeds the 19 MB limit`);
            }

            // Add file to form data
            formData.append('attachment', attachment);

            console.log('Sending message with attachment:', {
                sender_id: messageData.sender_id,
                receiver_id: messageData.receiver_id,
                message: messageData.message,
                attachment: attachment.name,
                attachment_type: attachment.type,
                attachment_size: `${fileSizeInMB.toFixed(2)} MB`
            });

            // Log form data contents
            for (let pair of formData.entries()) {
                console.log(`Form data: ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
            }

            try {
                // Set longer timeout for file uploads
                const response = await api.post('/message', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000, // 30 seconds timeout
                });
                console.log('File upload successful:', response.data);

                // Update the response to include the attachment URL
                if (response.data && response.data.data) {
                    const message = response.data.data;

                    // Log the message details for debugging
                    console.log('Message details:', {
                        id: message._id,
                        message: message.message,
                        attachment: message.attachment,
                        attachment_type: message.attachment_type
                    });
                }

                return response.data;
            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                console.error('Response:', uploadError.response?.data);

                // Fall back to sending just the message without attachment
                if (messageData.message && messageData.message.trim() !== '') {
                    console.log('Falling back to sending message without attachment');
                    const textResponse = await api.post('/message', {
                        sender_id: messageData.sender_id,
                        receiver_id: messageData.receiver_id,
                        message: messageData.message
                    });
                    return textResponse.data;
                }
                throw uploadError;
            }
        } else {
            // Regular JSON request without attachment
            const response = await api.post('/message', messageData);
            return response.data;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const deleteMessage = async (messageId) => {
    try {
        const response = await api.delete(`/message/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

// Group Chat API
export const getUserGroups = async (userId) => {
    try {
        const response = await api.get(`/groups/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user groups:', error);
        throw error;
    }
};

export const createGroup = async (groupData, avatar = null) => {
    try {
        // If there's an avatar, use FormData
        if (avatar) {
            const formData = new FormData();
            formData.append('name', groupData.name);
            formData.append('description', groupData.description);
            formData.append('creator', groupData.creator);

            // Append each member to the formData
            groupData.members.forEach(member => {
                formData.append('members', member);
            });

            formData.append('avatar', avatar);

            const response = await api.post('/group', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // Regular JSON request without avatar
            const response = await api.post('/group', groupData);
            return response.data;
        }
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

// Fonction pour récupérer les détails d'un utilisateur par son ID
export const getUserById = async (userId) => {
    try {
        // Si userId est un objet avec une propriété _id, utiliser cette propriété
        let id;
        if (typeof userId === 'object' && userId !== null && userId._id) {
            // Si l'objet contient déjà toutes les informations nécessaires, le renvoyer directement
            if (userId.firstName) {
                const user = {
                    _id: userId._id,
                    firstName: userId.firstName,
                    lastName: userId.lastName || '',
                    email: userId.email,
                    image: userId.image,
                    name: `${userId.firstName} ${userId.lastName || ''}`.trim(),
                    profileImage: userId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userId.firstName)}&background=4a6bff&color=fff`
                };
                console.log(`Using embedded user details: ${user.name}`);
                return user;
            }
            id = userId._id;
        } else {
            id = userId;
        }

        console.log(`Fetching user details for ID: ${id}`);
        // Utiliser axios directement au lieu de l'instance api qui a un baseURL spécifique pour le chat
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/users/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('User details response:', response.data);

        if (response.data && response.data.success && response.data.data) {
            const user = response.data.data;

            // S'assurer que le nom est correctement défini
            if (!user.name) {
                user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
            }

            // S'assurer que l'image de profil est définie
            if (!user.profileImage) {
                user.profileImage = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4a6bff&color=fff`;
            }

            return user;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching user details for ID ${typeof userId === 'object' ? JSON.stringify(userId) : userId}:`, error);
        return null;
    }
};

// Cache pour stocker les détails des utilisateurs
const userCache = {};

// Fonction pour récupérer les détails d'un utilisateur avec cache
export const getCachedUserById = async (userId) => {
    // Si l'utilisateur est déjà dans le cache, le renvoyer
    if (userCache[userId]) {
        return userCache[userId];
    }

    // Sinon, récupérer les détails de l'utilisateur et les mettre en cache
    const user = await getUserById(userId);
    if (user) {
        userCache[userId] = user;
    }

    return user;
};

export const getGroupMessages = async (groupId, userId) => {
    try {
        console.log(`Fetching group messages for group ${groupId} and user ${userId}`);
        const response = await api.get(`/group/${groupId}/${userId}`);
        console.log('Group messages response:', response.data);

        // Vérifier si la réponse est valide et contient des données
        if (response.data && response.data.success && response.data.data && response.data.data.messages) {
            // Récupérer tous les IDs d'expéditeurs uniques
            // S'assurer que nous extrayons correctement l'ID, qu'il soit un objet ou une chaîne
            const senderIds = [...new Set(
                response.data.data.messages
                    .filter(message => message.sender_id)
                    .map(message => {
                        // Si sender_id est un objet avec une propriété _id, utiliser cette propriété
                        if (typeof message.sender_id === 'object' && message.sender_id !== null && message.sender_id._id) {
                            console.log(`Extracted ID from object: ${message.sender_id._id}`);
                            return message.sender_id._id;
                        }
                        // Si sender_id est une chaîne, l'utiliser directement
                        else if (typeof message.sender_id === 'string') {
                            return message.sender_id;
                        }
                        // Sinon, convertir en chaîne (fallback)
                        else {
                            console.warn(`Unexpected sender_id format:`, message.sender_id);
                            return String(message.sender_id);
                        }
                    })
            )];

            console.log(`Found ${senderIds.length} unique sender IDs:`, senderIds);

            // Récupérer les détails de tous les expéditeurs
            const senderPromises = senderIds.map(senderId => getCachedUserById(senderId));
            const senders = await Promise.all(senderPromises);

            // Créer un map pour un accès rapide aux informations de l'expéditeur
            const sendersMap = {};
            senders.forEach(sender => {
                if (sender) {
                    sendersMap[sender._id] = sender;
                }
            });

            console.log(`Retrieved ${Object.keys(sendersMap).length} sender details`);

            // Ajouter les informations de l'expéditeur à chaque message
            response.data.data.messages = await Promise.all(response.data.data.messages.map(async (message) => {
                try {
                    // Extraire l'ID de l'expéditeur, qu'il soit un objet ou une chaîne
                    let senderId;
                    if (typeof message.sender_id === 'object' && message.sender_id !== null && message.sender_id._id) {
                        senderId = message.sender_id._id;

                        // Si l'objet sender_id contient déjà toutes les informations nécessaires, l'utiliser directement
                        if (message.sender_id.firstName) {
                            const sender = {
                                _id: message.sender_id._id,
                                firstName: message.sender_id.firstName,
                                lastName: message.sender_id.lastName || '',
                                email: message.sender_id.email,
                                image: message.sender_id.image,
                                name: `${message.sender_id.firstName} ${message.sender_id.lastName || ''}`.trim(),
                                profileImage: message.sender_id.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender_id.firstName)}&background=4a6bff&color=fff`
                            };
                            message.sender = sender;
                            console.log(`Used embedded sender details for message: ${sender.name}`);
                            return message;
                        }
                    } else if (typeof message.sender_id === 'string') {
                        senderId = message.sender_id;
                    } else {
                        console.warn(`Unexpected sender_id format:`, message.sender_id);
                        senderId = String(message.sender_id);
                    }

                    // Vérifier si l'ID est dans le cache
                    if (senderId && sendersMap[senderId]) {
                        message.sender = sendersMap[senderId];
                        console.log(`Added sender details for message: ${message.sender.name}`);
                    } else if (senderId) {
                        // Si l'expéditeur n'est pas dans le map, essayer de le récupérer directement
                        // Utiliser axios directement pour récupérer les détails de l'utilisateur
                        const token = localStorage.getItem('token');
                        const userResponse = await axios.get(`http://localhost:3000/users/${senderId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                            const sender = userResponse.data.data;
                            message.sender = sender;
                            // Mettre en cache pour les futures utilisations
                            sendersMap[senderId] = sender;
                            userCache[senderId] = sender;
                            console.log(`Directly fetched sender details for message: ${sender.name}`);
                        } else {
                            console.warn(`Could not find sender details for message ID: ${message._id}, sender ID: ${senderId}`);
                            message.sender = {
                                _id: senderId,
                                name: 'Utilisateur inconnu',
                                profileImage: `https://ui-avatars.com/api/?name=Utilisateur&background=4a6bff&color=fff`
                            };
                        }
                    } else {
                        console.warn(`Message ${message._id} has no valid sender_id`);
                        message.sender = {
                            name: 'Utilisateur inconnu',
                            profileImage: `https://ui-avatars.com/api/?name=Utilisateur&background=4a6bff&color=fff`
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching sender details for message ID: ${message._id}, sender ID:`, message.sender_id, error);
                    message.sender = {
                        _id: typeof message.sender_id === 'object' && message.sender_id !== null ? message.sender_id._id : message.sender_id,
                        name: 'Utilisateur inconnu',
                        profileImage: `https://ui-avatars.com/api/?name=Utilisateur&background=4a6bff&color=fff`
                    };
                }

                return message;
            }));

            // Log pour débogage
            if (response.data.data.messages.length > 0) {
                console.log('First message sender after processing:', response.data.data.messages[0].sender);
            }
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching group messages:', error);
        // Au lieu de propager l'erreur, retournons un objet avec success: false
        // pour que le composant puisse gérer l'erreur plus gracieusement
        return {
            success: false,
            error: error.message,
            data: { messages: [] }
        };
    }
};

export const sendGroupMessage = async (messageData, attachment = null) => {
    try {
        // Ensure messageData has a message property
        if (!messageData.message) {
            messageData.message = attachment ? 'Pièce jointe' : '';
        }

        // If there's an attachment, use FormData
        if (attachment) {
            const formData = new FormData();
            formData.append('group_id', messageData.group_id);
            formData.append('sender_id', messageData.sender_id);
            formData.append('message', messageData.message); // This should now always have a value

            // Check file size
            const fileSizeInMB = attachment.size / (1024 * 1024);
            console.log(`Group file size: ${fileSizeInMB.toFixed(2)} MB`);

            if (fileSizeInMB > 19) {
                throw new Error(`File size (${fileSizeInMB.toFixed(2)} MB) exceeds the 19 MB limit`);
            }

            formData.append('attachment', attachment);

            console.log('Sending group message with attachment:', {
                group_id: messageData.group_id,
                sender_id: messageData.sender_id,
                message: messageData.message,
                attachment: attachment.name,
                attachment_type: attachment.type,
                attachment_size: `${fileSizeInMB.toFixed(2)} MB`
            });

            // Log form data contents
            for (let pair of formData.entries()) {
                console.log(`Group form data: ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`);
            }

            try {
                const response = await api.post('/group/message', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000, // 30 seconds timeout
                });
                console.log('Group file upload successful:', response.data);

                // Update the response to include the attachment URL
                if (response.data && response.data.data) {
                    const message = response.data.data;

                    // Log the message details for debugging
                    console.log('Group message details:', {
                        id: message._id,
                        message: message.message,
                        attachment: message.attachment,
                        attachment_type: message.attachment_type
                    });
                }

                return response.data;
            } catch (uploadError) {
                console.error('Error uploading file to group:', uploadError);
                console.error('Response:', uploadError.response?.data);

                // Fall back to sending just the message without attachment
                if (messageData.message && messageData.message.trim() !== '') {
                    console.log('Falling back to sending group message without attachment');
                    const textResponse = await api.post('/group/message', {
                        group_id: messageData.group_id,
                        sender_id: messageData.sender_id,
                        message: messageData.message
                    });
                    return textResponse.data;
                }
                throw uploadError;
            }
        } else {
            // Regular JSON request without attachment
            const response = await api.post('/group/message', messageData);
            return response.data;
        }
    } catch (error) {
        console.error('Error sending group message:', error);
        throw error;
    }
};

export const deleteGroupMessage = async (messageId) => {
    try {
        const response = await api.delete(`/group/message/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting group message:', error);
        throw error;
    }
};

// Socket.io event listeners
export const onNewMessage = (callback) => {
    socket.on('new_message', callback);
};

export const onMessageSent = (callback) => {
    socket.on('message_sent', callback);
};

export const onNewGroupMessage = (callback) => {
    socket.on('new_group_message', callback);
};

export const onGroupMessageSent = (callback) => {
    socket.on('group_message_sent', callback);
};

export const onUserTyping = (callback) => {
    socket.on('user_typing', callback);
};

export const onUserStopTyping = (callback) => {
    socket.on('user_stop_typing', callback);
};

// Socket.io event listeners removal
export const offNewMessage = () => {
    socket.off('new_message');
};

export const offMessageSent = () => {
    socket.off('message_sent');
};

export const offNewGroupMessage = () => {
    socket.off('new_group_message');
};

export const offGroupMessageSent = () => {
    socket.off('group_message_sent');
};

export const offUserTyping = () => {
    socket.off('user_typing');
};

export const offUserStopTyping = () => {
    socket.off('user_stop_typing');
};

// Socket.io event emitters
export const emitPrivateMessage = (messageData) => {
    console.log('Emitting private message via socket:', messageData);

    // Envoyer uniquement via Socket.IO
    // Le backend devrait sauvegarder le message lorsqu'il le reçoit via Socket.IO
    socket.emit('private_message', messageData);

    // Retourner une promesse résolue pour maintenir la compatibilité avec le code existant
    return Promise.resolve({ success: true, data: null });
};

export const emitGroupMessage = (messageData) => {
    console.log('Emitting group message via socket:', messageData);

    // Envoyer uniquement via Socket.IO
    // Le backend devrait sauvegarder le message lorsqu'il le reçoit via Socket.IO
    socket.emit('group_message', messageData);

    // Retourner une promesse résolue pour maintenir la compatibilité avec le code existant
    return Promise.resolve({ success: true, data: null });
};

export const emitTyping = (data) => {
    socket.emit('typing', data);
};

export const emitStopTyping = (data) => {
    socket.emit('stop_typing', data);
};

export default {
    getUserChats,
    getConversation,
    sendMessage,
    deleteMessage,
    getUserGroups,
    createGroup,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    connectSocket,
    onNewMessage,
    onMessageSent,
    onNewGroupMessage,
    onGroupMessageSent,
    onUserTyping,
    onUserStopTyping,
    offNewMessage,
    offMessageSent,
    offNewGroupMessage,
    offGroupMessageSent,
    offUserTyping,
    offUserStopTyping,
    emitPrivateMessage,
    emitGroupMessage,
    emitTyping,
    emitStopTyping,
    // Ajouter les fonctions de stockage local
    saveConversationsToLocalStorage,
    getConversationsFromLocalStorage,
    saveGroupsToLocalStorage,
    getGroupsFromLocalStorage
};
