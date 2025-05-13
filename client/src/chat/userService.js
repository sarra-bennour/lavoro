import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Créer une instance axios avec les headers d'authentification
const createAuthAxios = () => {
    const token = localStorage.getItem('token');

    return axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        withCredentials: true
    });
};

// Fonction pour récupérer les informations utilisateur à partir du token JWT
export const fetchUserInfo = async () => {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No token found in localStorage');
            return null;
        }

        const api = createAuthAxios();
        const response = await api.get('/users/me');

        if (response.data) {
            // Stocker les informations utilisateur dans localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        }

        return null;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
};

// Fonction pour récupérer tous les utilisateurs
export const fetchAllUsers = async () => {
    try {
        console.log('Fetching all users from API...');
        const api = createAuthAxios();

        // Récupérer l'ID de l'utilisateur actuel
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const userId = currentUser._id || currentUser.id;

        if (!userId) {
            console.error('No user ID found in localStorage');
            return [];
        }

        // Utiliser la route de contacts du chat qui inclut les photos de profil
        console.log(`Calling API endpoint: /chat/contacts/${userId}`);
        const response = await api.get(`/chat/contacts/${userId}`);

        console.log('Users response:', response.data);

        if (response.data && response.data.success && response.data.data) {
            // La réponse est déjà organisée par lettre, nous pouvons la retourner directement
            const contacts = flattenContacts(response.data.data);
            console.log(`Successfully fetched ${contacts.length} contacts from database`);
            return contacts;
        }

        console.warn('Invalid users response format:', response.data);
        return [];
    } catch (error) {
        console.error('Error fetching all users:', error.message);
        console.error('Error details:', error);
        return [];
    }
};

// Fonction pour aplatir les contacts organisés par lettre en une seule liste
const flattenContacts = (contacts) => {
    const flatList = [];
    Object.keys(contacts).forEach(letter => {
        contacts[letter].forEach(contact => {
            flatList.push(contact);
        });
    });
    return flatList;
};

// Fonction pour organiser les utilisateurs par ordre alphabétique pour l'affichage des contacts
export const organizeUsersByAlphabet = (users) => {
    if (!Array.isArray(users) || users.length === 0) {
        console.log("No users to organize or invalid users array");
        return {};
    }

    console.log("Organizing users by alphabet, total users:", users.length);

    // Filtrer les utilisateurs valides (qui ont un nom)
    const validUsers = users.filter(user => {
        // Vérifier si l'utilisateur a un nom
        if (!user || typeof user.name !== 'string') {
            console.log("Invalid user found without name:", user);

            // Si l'utilisateur a firstName et lastName, créer un nom
            if (user && user.firstName) {
                user.name = `${user.firstName} ${user.lastName || ''}`.trim();
                console.log("Created name for user:", user.name);
                return true;
            }
            return false;
        }
        return true;
    });

    console.log("Valid users with names:", validUsers.length);

    // Trier les utilisateurs par nom
    validUsers.sort((a, b) => a.name.localeCompare(b.name));

    // Organiser les utilisateurs par première lettre du nom
    const organizedUsers = {};

    validUsers.forEach(user => {
        const firstLetter = user.name.charAt(0).toUpperCase();

        if (!organizedUsers[firstLetter]) {
            organizedUsers[firstLetter] = [];
        }

        // Ensure user has profileImage property
        if (!user.profileImage && user.image) {
            user.profileImage = user.image;
        }

        organizedUsers[firstLetter].push(user);
    });

    console.log("Organized users by alphabet, letters:", Object.keys(organizedUsers));

    return organizedUsers;
};

export default {
    fetchUserInfo,
    fetchAllUsers,
    organizeUsersByAlphabet
};
