import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import './accordionStyles.css';

// URL de base de l'API pour les images
const API_URL = 'https://lavoro-back.onrender.com';

const ChatSidebar = ({
    conversations,
    groups,
    contacts,
    activeChat,
    activeTab,
    setActiveTab,
    onChatSelect,
    searchQuery,
    onSearch,
    currentUser,
    onCreateGroup
}) => {
    // État pour suivre quelles sections sont ouvertes/fermées
    const [expandedSections, setExpandedSections] = useState({
        myGroups: true,
        groupConversations: true,
        contacts: {}  // Objet pour stocker l'état de chaque lettre dans les contacts
    });

    // Initialiser les sections de contacts comme ouvertes par défaut
    useEffect(() => {
        if (Object.keys(contacts).length > 0 && Object.keys(expandedSections.contacts).length === 0) {
            const initialContactsState = {};
            Object.keys(contacts).forEach(letter => {
                initialContactsState[letter] = true;  // Toutes les lettres sont ouvertes par défaut
            });

            setExpandedSections(prev => ({
                ...prev,
                contacts: initialContactsState
            }));
        }
    }, [contacts]);

    // Fonction pour basculer l'état d'une section
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Fonction pour basculer l'état d'une lettre dans les contacts
    const toggleContactLetter = (letter) => {
        setExpandedSections(prev => ({
            ...prev,
            contacts: {
                ...prev.contacts,
                [letter]: !prev.contacts[letter]
            }
        }));
    };

    // Format timestamp to relative time (e.g., "il y a 5 minutes")
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: fr });
    };

    // Truncate long messages
    const truncateMessage = (message, maxLength = 30) => {
        if (!message) return '';
        return message.length > maxLength
            ? message.substring(0, maxLength) + '...'
            : message;
    };

    return (
        <div className="chat-info border">
            {/* Search Bar */}
            <div className="chat-search p-3 border-bottom">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher une conversation"
                        value={searchQuery}
                        onChange={onSearch}
                        aria-describedby="button-addon01"
                    />
                    <button
                        aria-label="button"
                        className="btn btn-primary-light"
                        type="button"
                        id="button-addon01"
                    >
                        <i className="ri-search-line"></i>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <ul
                className="nav nav-tabs tab-style-6 nav-justified mb-0 border-bottom d-flex gap-1 gap-sm-2 flex-wrap"
                id="myTab1"
                role="tablist"
            >
                <li className="nav-item me-0" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                        id="users-tab"
                        onClick={() => setActiveTab('users')}
                        type="button"
                        role="tab"
                    >
                        Récents
                        {conversations.some(conv => conv.unreadCount > 0) && (
                            <span className="badge bg-primary1 rounded-pill float-end shadow-sm">
                                {conversations.reduce((total, conv) => total + conv.unreadCount, 0)}
                            </span>
                        )}
                    </button>
                </li>
                <li className="nav-item me-0" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`}
                        id="groups-tab"
                        onClick={() => setActiveTab('groups')}
                        type="button"
                        role="tab"
                    >
                        Groupes
                        {groups.some(group => group.unreadCount > 0) && (
                            <span className="badge bg-primary3 rounded-pill float-end shadow-sm">
                                {groups.reduce((total, group) => total + group.unreadCount, 0)}
                            </span>
                        )}
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'contacts' ? 'active' : ''}`}
                        id="contacts-tab"
                        onClick={() => setActiveTab('contacts')}
                        type="button"
                        role="tab"
                    >
                        Contacts
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content" id="myTabContent">
                {/* Recent Chats Tab */}
                <div
                    className={`tab-pane ${activeTab === 'users' ? 'show active' : ''} border-0 chat-users-tab`}
                    id="users-tab-pane"
                    role="tabpanel"
                    aria-labelledby="users-tab"
                    tabIndex="0"
                >
                    <ul className="list-unstyled mb-0 mt-2 chat-users-tab" id="chat-msg-scroll">
                        {conversations.length > 0 ? (
                            <>
                                {/* Conversations en ligne */}
                                {conversations.filter(conv => conv.user.status === 'online').length > 0 && (
                                    <>
                                        <li className="pb-0">
                                            <p className="text-muted fs-11 fw-medium mb-2 op-7">CONVERSATIONS ACTIVES</p>
                                        </li>
                                        {conversations
                                            .filter(conv => conv.user.status === 'online')
                                            .map((conv, index) => (
                                                <li
                                                    key={`active-${index}`}
                                                    className={`checkforactive ${
                                                        activeChat &&
                                                        activeChat.type === 'direct' &&
                                                        activeChat.user._id === conv.user._id
                                                            ? 'active'
                                                            : ''
                                                    } ${conv.unreadCount > 0 ? 'chat-msg-unread' : ''}`}
                                                >
                                                    <a
                                                        href="javascript:void(0);"
                                                        onClick={() => onChatSelect(conv, 'direct')}
                                                    >
                                                        <div className="d-flex align-items-top">
                                                            <div className="me-1 lh-1">
                                                                <span className="avatar avatar-md online me-2">
                                                                    <img
                                                                        src={
                                                                            conv.user.profileImage
                                                                                ? (conv.user.profileImage.startsWith('http')
                                                                                    ? conv.user.profileImage
                                                                                    : `${API_URL}/${conv.user.profileImage.replace(/^\//, '')}`)
                                                                                : conv.user.image
                                                                                    ? (conv.user.image.startsWith('http')
                                                                                        ? conv.user.image
                                                                                        : `${API_URL}/${conv.user.image.replace(/^\//, '')}`)
                                                                                    : "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.user.name || conv.user.firstName || 'User') + "&background=4a6bff&color=fff"
                                                                        }
                                                                        alt={conv.user.name || `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur'}
                                                                        onError={(e) => {
                                                                            console.log("Image error for user:", conv.user.name || conv.user.firstName);
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.user.name || conv.user.firstName || 'User') + "&background=4a6bff&color=fff";
                                                                        }}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="flex-fill">
                                                                <p className="mb-0 fw-medium">
                                                                    {conv.user.name || `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur'}
                                                                    <span className="float-end text-muted fw-normal fs-11">
                                                                        {formatTime(conv.lastMessage?.sent_at)}
                                                                    </span>
                                                                </p>
                                                                <p className="fs-12 mb-0">
                                                                    <span className="chat-msg text-truncate">
                                                                        {truncateMessage(conv.lastMessage?.message)}
                                                                    </span>
                                                                    {conv.unreadCount > 0 && (
                                                                        <span className="badge bg-primary2 rounded-pill float-end">
                                                                            {conv.unreadCount}
                                                                        </span>
                                                                    )}
                                                                    {conv.unreadCount === 0 && conv.lastMessage?.sender_id === currentUser?._id && (
                                                                        <span className="chat-read-icon float-end align-middle">
                                                                            <i className="ri-check-double-fill"></i>
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </li>
                                            ))}
                                    </>
                                )}

                                {/* Conversations hors ligne */}
                                {conversations.filter(conv => conv.user.status !== 'online').length > 0 && (
                                    <>
                                        <li className="pb-0">
                                            <p className="text-muted fs-11 fw-medium mb-2 op-7">TOUTES LES CONVERSATIONS</p>
                                        </li>
                                        {conversations
                                            .filter(conv => conv.user.status !== 'online')
                                            .map((conv, index) => (
                                                <li
                                                    key={`inactive-${index}`}
                                                    className={`chat-inactive checkforactive ${
                                                        activeChat &&
                                                        activeChat.type === 'direct' &&
                                                        activeChat.user._id === conv.user._id
                                                            ? 'active'
                                                            : ''
                                                    } ${conv.unreadCount > 0 ? 'chat-msg-unread' : ''}`}
                                                >
                                                    <a
                                                        href="javascript:void(0);"
                                                        onClick={() => onChatSelect(conv, 'direct')}
                                                    >
                                                        <div className="d-flex align-items-top">
                                                            <div className="me-1 lh-1">
                                                                <span className="avatar avatar-md offline me-2">
                                                                    <img
                                                                        src={
                                                                            conv.user.profileImage
                                                                                ? (conv.user.profileImage.startsWith('http')
                                                                                    ? conv.user.profileImage
                                                                                    : `${API_URL}/${conv.user.profileImage.replace(/^\//, '')}`)
                                                                                : conv.user.image
                                                                                    ? (conv.user.image.startsWith('http')
                                                                                        ? conv.user.image
                                                                                        : `${API_URL}/${conv.user.image.replace(/^\//, '')}`)
                                                                                    : "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.user.name || conv.user.firstName || 'User') + "&background=4a6bff&color=fff"
                                                                        }
                                                                        alt={conv.user.name || `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur'}
                                                                        onError={(e) => {
                                                                            console.log("Image error for user:", conv.user.name || conv.user.firstName);
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(conv.user.name || conv.user.firstName || 'User') + "&background=4a6bff&color=fff";
                                                                        }}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="flex-fill">
                                                                <p className="mb-0 fw-medium">
                                                                    {conv.user.name || `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || 'Utilisateur'}
                                                                    <span className="float-end text-muted fw-normal fs-11">
                                                                        {formatTime(conv.lastMessage?.sent_at)}
                                                                    </span>
                                                                </p>
                                                                <p className="fs-12 mb-0">
                                                                    <span className="chat-msg text-truncate">
                                                                        {truncateMessage(conv.lastMessage?.message)}
                                                                    </span>
                                                                    {conv.unreadCount > 0 && (
                                                                        <span className="badge bg-primary2 rounded-pill float-end">
                                                                            {conv.unreadCount}
                                                                        </span>
                                                                    )}
                                                                    {conv.unreadCount === 0 && conv.lastMessage?.sender_id === currentUser?._id && (
                                                                        <span className="chat-read-icon float-end align-middle">
                                                                            <i className="ri-check-double-fill"></i>
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </li>
                                            ))}
                                    </>
                                )}
                            </>
                        ) : (
                            <li className="text-center p-4">
                                <div className="empty-state">
                                    <i className="ri-chat-3-line fs-40 text-muted mb-2"></i>
                                    <p className="mb-1">Aucune conversation récente</p>
                                    <small className="text-muted">
                                        Commencez une nouvelle conversation en allant dans l'onglet "Contacts"
                                    </small>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Groups Tab */}
                <div
                    className={`tab-pane ${activeTab === 'groups' ? 'show active' : ''} border-0 chat-groups-tab`}
                    id="groups-tab-pane"
                    role="tabpanel"
                    aria-labelledby="groups-tab"
                    tabIndex="0"
                >
                    <div className="chat-groups-container">
                        {/* Mes groupes de discussion - Section déroulante */}
                        <div className="accordion-item border-0">
                            <div
                                className="accordion-header d-flex justify-content-between align-items-center p-2 cursor-pointer sticky-top bg-body"
                                onClick={() => toggleSection('myGroups')}
                            >
                                <div className="d-flex align-items-center">
                                    <i className={`ri-arrow-${expandedSections.myGroups ? 'down' : 'right'}-s-line me-2`}></i>
                                    <p className="text-muted fs-11 fw-medium mb-0 op-7">MES GROUPES DE DISCUSSION</p>
                                </div>
                                <button
                                    className="btn btn-sm btn-primary-light rounded-circle create-group-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Empêcher le clic de se propager à l'en-tête
                                        onCreateGroup();
                                    }}
                                    title="Créer un nouveau groupe"
                                >
                                    <i className="ri-add-line"></i>
                                </button>
                            </div>

                            {expandedSections.myGroups && (
                                <div className="accordion-body">
                                    <ul className="list-unstyled mb-0 mt-2">
                                        {groups.length > 0 ? (
                                            groups.map((group, index) => (
                                                <li key={index} className="px-3 py-2">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <p className="mb-0 fw-medium">
                                                                <i className="ri-checkbox-blank-circle-fill lh-1 text-primary me-1 fs-8 align-middle"></i>
                                                                {group.name}
                                                            </p>
                                                            <p className="mb-0">
                                                                <span className="badge bg-primary3-transparent">
                                                                    {group.members.filter(member => member.status === 'online').length} En ligne
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="avatar-list-stacked my-auto">
                                                            {group.members.slice(0, 4).map((member, idx) => (
                                                                <span key={idx} className="avatar avatar-sm avatar-rounded">
                                                                    <img
                                                                        src={
                                                                            member.profileImage
                                                                                ? (member.profileImage.startsWith('http')
                                                                                    ? member.profileImage
                                                                                    : `${API_URL}/${member.profileImage.replace(/^\//, '')}`)
                                                                                : member.image
                                                                                    ? (member.image.startsWith('http')
                                                                                        ? member.image
                                                                                        : `${API_URL}/${member.image.replace(/^\//, '')}`)
                                                                                    : "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name || member.firstName || 'User') + "&background=4a6bff&color=fff"
                                                                        }
                                                                        alt={member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur'}
                                                                        onError={(e) => {
                                                                            console.log("Image error for member:", member.name || member.firstName);
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.name || member.firstName || 'User') + "&background=4a6bff&color=fff";
                                                                        }}
                                                                    />
                                                                </span>
                                                            ))}
                                                            {group.members.length > 4 && (
                                                                <a
                                                                    className="avatar avatar-sm bg-primary text-fixed-white avatar-rounded"
                                                                    href="javascript:void(0);"
                                                                >
                                                                    +{group.members.length - 4}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-center p-3">
                                                <p className="text-muted">Aucun groupe trouvé</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Conversations de groupe - Section déroulante */}
                        <div className="accordion-item border-0 mt-2">
                            <div
                                className="accordion-header d-flex justify-content-between align-items-center p-2 cursor-pointer sticky-top bg-body"
                                onClick={() => toggleSection('groupConversations')}
                            >
                                <div className="d-flex align-items-center">
                                    <i className={`ri-arrow-${expandedSections.groupConversations ? 'down' : 'right'}-s-line me-2`}></i>
                                    <p className="text-muted fs-11 fw-medium mb-0 op-7">CONVERSATIONS DE GROUPE</p>
                                </div>
                            </div>

                            {expandedSections.groupConversations && (
                                <div className="accordion-body">
                                    <ul className="list-unstyled mb-0">
                                        {groups.length > 0 ? (
                                            groups.map((group, index) => (
                                                <li
                                                    key={`group-${index}`}
                                                    className={`checkforactive ${
                                                        activeChat &&
                                                        activeChat.type === 'group' &&
                                                        activeChat._id === group._id
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                >
                                                    <a
                                                        href="javascript:void(0);"
                                                        onClick={() => onChatSelect(group, 'group')}
                                                    >
                                                        <div className="d-flex align-items-top">
                                                            <div className="me-1 lh-1">
                                                                <span className="avatar avatar-md online me-2">
                                                                    {console.log("Group avatar debug:", {
                                                                        groupName: group.name,
                                                                        avatar: group.avatar,
                                                                        hasAvatar: !!group.avatar,
                                                                        fullGroup: group
                                                                    })}
                                                                    <img
                                                                        src={
                                                                            group.avatar
                                                                                ? (group.avatar.startsWith('http')
                                                                                    ? group.avatar
                                                                                    : `${API_URL}/${group.avatar.replace(/^\//, '')}`)
                                                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name || 'Group')}&background=4a6bff&color=fff`
                                                                        }
                                                                        alt={group.name}
                                                                        onError={(e) => {
                                                                            console.log("Image error for group:", group.name, "Avatar path:", e.target.src);
                                                                            e.target.onerror = null;
                                                                            e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(group.name || 'Group') + "&background=4a6bff&color=fff";
                                                                        }}
                                                                    />
                                                                </span>
                                                            </div>
                                                            <div className="flex-fill">
                                                                <p className="mb-0 fw-medium">
                                                                    {group.name}
                                                                    <span className="float-end text-muted fw-normal fs-11">
                                                                        {formatTime(group.lastMessage?.sent_at)}
                                                                    </span>
                                                                </p>
                                                                <p className="fs-12 mb-0">
                                                                    <span className="chat-msg text-truncate">
                                                                        {group.lastMessage ? (
                                                                            <>
                                                                                <span className="group-indivudial">
                                                                                    {group.lastMessage.sender_id === currentUser?._id
                                                                                        ? 'Vous'
                                                                                        : group.lastMessage.sender?.name?.split(' ')[0] || 'Utilisateur'}:
                                                                                </span>{' '}
                                                                                {truncateMessage(group.lastMessage.message)}
                                                                            </>
                                                                        ) : (
                                                                            'Aucun message'
                                                                        )}
                                                                    </span>
                                                                    {group.unreadCount > 0 && (
                                                                        <span className="badge bg-primary3 rounded-circle float-end">
                                                                            {group.unreadCount}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-center p-3">
                                                <p className="text-muted">Aucune conversation de groupe</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contacts Tab */}
                <div
                    className={`tab-pane ${activeTab === 'contacts' ? 'show active' : ''} border-0 chat-contacts-tab`}
                    id="contacts-tab-pane"
                    role="tabpanel"
                    aria-labelledby="contacts-tab"
                    tabIndex="0"
                >
                    <div className="chat-contacts-tab">
                        {Object.keys(contacts).length > 0 ? (
                            <div className="accordion-contacts-container">
                                {Object.keys(contacts).sort().map((letter) => (
                                    <div key={letter} className="accordion-item border-0">
                                        {/* En-tête de la lettre (déroulant) */}
                                        <div
                                            className="accordion-header d-flex align-items-center p-2 cursor-pointer sticky-top bg-body"
                                            onClick={() => toggleContactLetter(letter)}
                                        >
                                            <i className={`ri-arrow-${expandedSections.contacts[letter] ? 'down' : 'right'}-s-line me-2`}></i>
                                            <span className="text-default fw-semibold">{letter}</span>
                                            <span className="ms-2 text-muted fs-12">({contacts[letter].length})</span>
                                        </div>

                                        {/* Liste des contacts pour cette lettre */}
                                        {expandedSections.contacts[letter] && (
                                            <div className="accordion-body ps-4 py-0">
                                                <ul className="list-unstyled">
                                                    {contacts[letter].map((contact, index) => (
                                                        <li key={index} className="py-2">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="lh-1">
                                                                    <span className="avatar avatar-sm">
                                                                        <img
                                                                            src={
                                                                                contact.profileImage
                                                                                    ? (contact.profileImage.startsWith('http')
                                                                                        ? contact.profileImage
                                                                                        : `${API_URL}/${contact.profileImage.replace(/^\//, '')}`)
                                                                                    : contact.image
                                                                                        ? (contact.image.startsWith('http')
                                                                                            ? contact.image
                                                                                            : `${API_URL}/${contact.image.replace(/^\//, '')}`)
                                                                                        : "https://ui-avatars.com/api/?name=" + encodeURIComponent(contact.name || contact.firstName || 'User') + "&background=4a6bff&color=fff"
                                                                            }
                                                                            alt={contact.name || `${contact.firstName} ${contact.lastName || ''}`}
                                                                            onError={(e) => {
                                                                                console.log("Image error for contact:", contact.name || contact.firstName);
                                                                                e.target.onerror = null;
                                                                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(contact.name || `${contact.firstName} ${contact.lastName || ''}` || 'User') + "&background=4a6bff&color=fff";
                                                                            }}
                                                                        />
                                                                    </span>
                                                                </div>
                                                                <div className="flex-fill">
                                                                    <span className="d-block fw-semibold">
                                                                        {contact.name || `${contact.firstName} ${contact.lastName || ''}`}
                                                                    </span>
                                                                    <small className="text-muted">{contact.email}</small>
                                                                </div>
                                                                <button
                                                                    className="btn btn-sm btn-primary-light"
                                                                    onClick={() => {
                                                                        // Create a new conversation object
                                                                        const newConv = {
                                                                            user: contact,
                                                                            lastMessage: null,
                                                                            unreadCount: 0
                                                                        };
                                                                        onChatSelect(newConv, 'direct');
                                                                    }}
                                                                >
                                                                    <i className="ri-message-2-line me-1"></i>
                                                                    Chat
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-3">
                                <p className="text-muted">Aucun contact trouvé</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
