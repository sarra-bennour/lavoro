import React, { useState, useEffect } from 'react';
import * as chatClient from './chatClient.js';

// URL de base de l'API pour les images
const API_URL = 'https://lavoro-back.onrender.com';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, currentUser, contacts }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal is opened
    useEffect(() => {
        if (isOpen) {
            setGroupName('');
            setGroupDescription('');
            setSelectedContacts([]);
            setSearchQuery('');
            setGroupAvatar(null);
            setAvatarPreview(null);
            setError('');
        }
    }, [isOpen]);

    // Handle avatar selection
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGroupAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle contact selection
    const toggleContactSelection = (contact) => {
        if (selectedContacts.some(c => c._id === contact._id)) {
            setSelectedContacts(selectedContacts.filter(c => c._id !== contact._id));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    // Filter contacts based on search query
    const getFilteredContacts = () => {
        if (!contacts) return {};

        const filtered = {};
        Object.keys(contacts).forEach(letter => {
            const filteredContacts = contacts[letter].filter(contact =>
                contact.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                contact._id !== currentUser._id // Exclude current user
            );

            if (filteredContacts.length > 0) {
                filtered[letter] = filteredContacts;
            }
        });

        return filtered;
    };

    // Create group
    const handleCreateGroup = async () => {
        // Validate form
        if (!groupName.trim()) {
            setError('Le nom du groupe est requis');
            return;
        }

        if (selectedContacts.length === 0) {
            setError('Veuillez sélectionner au moins un contact');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Prepare group data
            const groupData = {
                name: groupName.trim(),
                description: groupDescription.trim(),
                creator: currentUser._id,
                members: [...selectedContacts.map(c => c._id), currentUser._id] // Include current user
            };

            console.log("Creating group with data:", groupData);
            console.log("Group avatar:", groupAvatar ? {
                name: groupAvatar.name,
                type: groupAvatar.type,
                size: groupAvatar.size
            } : "No avatar");

            // Create group
            const newGroup = await chatClient.createGroup(groupData, groupAvatar);

            console.log("New group created:", newGroup);
            console.log("Group avatar path:", newGroup.avatar);

            // Ensure the avatar path is properly formatted
            if (newGroup && newGroup.avatar) {
                console.log("Original avatar path:", newGroup.avatar);

                // If the avatar path doesn't start with http or /, add the API_URL
                if (!newGroup.avatar.startsWith('http') && !newGroup.avatar.startsWith('/')) {
                    newGroup.avatar = `${API_URL}/${newGroup.avatar}`;
                } else if (newGroup.avatar.startsWith('/')) {
                    // If it starts with /, just add the API_URL
                    newGroup.avatar = `${API_URL}${newGroup.avatar}`;
                }

                console.log("Formatted avatar path:", newGroup.avatar);
            }

            // Notify parent component
            if (onGroupCreated) {
                onGroupCreated(newGroup);
            }

            // Close modal
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            setError('Une erreur est survenue lors de la création du groupe');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredContacts = getFilteredContacts();

    // Styles for modal components
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
    };

    const modalStyle = {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        border: '1px solid #dee2e6',
        color: '#212529'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
    };

    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        color: '#6c757d',
        cursor: 'pointer',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%'
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, color: '#212529', fontSize: '18px', fontWeight: 600 }}>
                        <i className="ri-group-line me-2"></i>Créer un nouveau groupe
                    </h3>
                    <button style={closeButtonStyle} onClick={onClose} aria-label="Fermer">
                        <i className="ri-close-line"></i>
                    </button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
                    <form className="row g-3 mt-0">
                        <div className="col-12 mb-3">
                            <div className="d-flex align-items-center">
                                <div className="me-3">
                                    <div
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f8f9fa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            color: '#4a6bff',
                                            fontSize: '32px',
                                            border: '2px solid #dee2e6',
                                            backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none'
                                        }}
                                    >
                                        {!avatarPreview && <i className="ri-group-line"></i>}
                                        <input
                                            type="file"
                                            id="group-avatar"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="group-avatar" style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: '#4a6bff',
                                            color: 'white',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <i className="ri-camera-line"></i>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="mb-1" style={{ color: '#212529' }}>Informations du groupe</h5>
                                    <p className="text-muted small mb-0" style={{ fontSize: '14px', color: '#6c757d' }}>Créez un groupe pour discuter avec plusieurs personnes</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="group-name" className="form-label">Nom du groupe*</label>
                            <input
                                type="text"
                                id="group-name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Entrez le nom du groupe"
                                className="form-control"
                                style={{ fontSize: '15px', padding: '10px 15px' }}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="group-description" className="form-label">Description</label>
                            <input
                                type="text"
                                id="group-description"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Entrez une description (optionnel)"
                                className="form-control"
                                style={{ fontSize: '15px', padding: '10px 15px' }}
                            />
                        </div>

                        <div className="col-12 mt-4">
                            <h5 className="mb-3" style={{ color: '#212529', fontWeight: 600, fontSize: '18px' }}>
                                <i className="ri-user-add-line me-2" style={{ color: '#212529' }}></i>
                                <span style={{ color: '#212529' }}>Ajouter des membres</span>
                            </h5>
                            <div className="input-group mb-3">
                                <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
                                    <i className="ri-search-line" style={{ color: '#6c757d' }}></i>
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher des contacts..."
                                    className="form-control"
                                    style={{ fontSize: '15px', padding: '10px 15px' }}
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        title="Effacer la recherche"
                                        style={{ borderColor: '#dee2e6', backgroundColor: '#f8f9fa', color: '#6c757d' }}
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="col-12">
                            {selectedContacts.length > 0 && (
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    borderColor: '#dee2e6',
                                    borderRadius: '0.25rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        backgroundColor: '#e9ecef',
                                        borderColor: '#dee2e6',
                                        color: '#212529',
                                        fontWeight: 600,
                                        padding: '0.75rem 1.25rem',
                                        borderBottom: '1px solid #dee2e6'
                                    }}>
                                        <i className="ri-user-follow-line me-1"></i>
                                        Membres sélectionnés ({selectedContacts.length})
                                    </div>
                                    <div style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                            {selectedContacts.map(contact => (
                                                <div key={contact._id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: 'rgba(74, 107, 255, 0.1)',
                                                    borderRadius: '20px',
                                                    padding: '4px 8px 4px 4px',
                                                    fontSize: '13px',
                                                    border: '1px solid rgba(74, 107, 255, 0.3)',
                                                    color: '#212529'
                                                }}>
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
                                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.firstName || 'User')}&background=4a6bff&color=fff`
                                                        }
                                                        alt={contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Utilisateur'}
                                                        style={{
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '50%',
                                                            marginRight: '6px',
                                                            objectFit: 'cover',
                                                            border: '1px solid #2c3034'
                                                        }}
                                                        onError={(e) => {
                                                            console.log("Image error for contact:", contact.name || contact.firstName);
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.firstName || 'User')}&background=4a6bff&color=fff`;
                                                        }}
                                                    />
                                                    <span style={{ color: '#212529' }}>{contact.name}</span>
                                                    <button
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#4a6bff',
                                                            cursor: 'pointer',
                                                            fontSize: '16px',
                                                            marginLeft: '4px',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            transition: 'color 0.2s'
                                                        }}
                                                        onClick={() => toggleContactSelection(contact)}
                                                        title="Retirer"
                                                        aria-label={`Retirer ${contact.name}`}
                                                        type="button"
                                                    >
                                                        <i className="ri-close-circle-line"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-12">
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                borderColor: '#dee2e6',
                                borderRadius: '0.25rem'
                            }}>
                                <div style={{
                                    backgroundColor: '#e9ecef',
                                    borderColor: '#dee2e6',
                                    color: '#212529',
                                    fontWeight: 600,
                                    padding: '0.75rem 1.25rem',
                                    borderBottom: '1px solid #dee2e6'
                                }}>
                                    <i className="ri-contacts-line me-1"></i>
                                    Contacts disponibles
                                </div>
                                <div style={{ padding: 0 }}>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {Object.keys(filteredContacts).length > 0 ? (
                                            Object.keys(filteredContacts).sort().map(letter => (
                                                <div key={letter} style={{ marginBottom: 0 }}>
                                                    <div style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#e9ecef',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#212529',
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1,
                                                        borderBottom: '1px solid #dee2e6'
                                                    }}>{letter}</div>
                                                    {filteredContacts[letter].map(contact => (
                                                        <div
                                                            key={contact._id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                backgroundColor: selectedContacts.some(c => c._id === contact._id) ? 'rgba(74, 107, 255, 0.1)' : '#ffffff',
                                                                borderBottom: '1px solid rgba(222, 226, 230, 0.5)'
                                                            }}
                                                            onClick={() => toggleContactSelection(contact)}
                                                        >
                                                            <div style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #dee2e6',
                                                                marginRight: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                backgroundColor: selectedContacts.some(c => c._id === contact._id) ? '#4a6bff' : 'transparent',
                                                                transition: 'all 0.2s ease'
                                                            }}>
                                                                {selectedContacts.some(c => c._id === contact._id) && (
                                                                    <i className="ri-check-line"></i>
                                                                )}
                                                            </div>
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
                                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.firstName || 'User')}&background=4a6bff&color=fff`
                                                                }
                                                                alt={contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Utilisateur'}
                                                                style={{
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    marginRight: '6px',
                                                                    objectFit: 'cover',
                                                                    border: '1px solid #dee2e6'
                                                                }}
                                                                onError={(e) => {
                                                                    console.log("Image error for contact:", contact.name || contact.firstName);
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || contact.firstName || 'User')}&background=4a6bff&color=fff`;
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '14px', color: '#fff' }}>{contact.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: '#e9ecef',
                                                fontSize: '14px',
                                                backgroundColor: '#252a30'
                                            }}>
                                                {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact disponible'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div className="alert mt-3" role="alert" style={{ backgroundColor: "#3a1c1c", color: "#f8d7da", borderColor: "#842029" }}>
                            <i className="ri-error-warning-line me-2"></i>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #2c3034',
                    backgroundColor: '#252a30',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px'
                }}>
                    <div className="col-12 d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onClose}
                            disabled={isLoading}
                            style={{ fontSize: '15px', padding: '10px 20px', fontWeight: '500' }}
                        >
                            <i className="ri-close-circle-line me-1"></i>
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateGroup}
                            disabled={isLoading}
                            style={{ fontSize: '15px', padding: '10px 20px', fontWeight: '500' }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Création...
                                </>
                            ) : (
                                <>
                                    <i className="ri-check-line me-1"></i>
                                    Créer le groupe
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
