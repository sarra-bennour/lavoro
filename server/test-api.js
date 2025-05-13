const axios = require('axios');

// Fonction pour tester l'API
async function testApi() {
    try {
        // Remplacez cet ID par un ID d'utilisateur valide de votre base de données
        const userId = '68080b1a59476514dd217dee';
        
        console.log(`Testing API endpoint: http://localhost:3000/chat/contacts/${userId}`);
        
        const response = await axios.get(`http://localhost:3000/chat/contacts/${userId}`);
        
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.success && response.data.data) {
            console.log('Contacts found:', Object.keys(response.data.data));
            
            // Afficher le nombre total de contacts
            let totalContacts = 0;
            Object.keys(response.data.data).forEach(letter => {
                totalContacts += response.data.data[letter].length;
            });
            
            console.log('Total number of contacts:', totalContacts);
        } else {
            console.log('No contacts found or invalid response format');
        }
    } catch (error) {
        console.error('Error testing API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Is the server running?');
        } else {
            console.error('Error details:', error);
        }
    }
}

// Exécuter le test
testApi();
