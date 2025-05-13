import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { microsoftAuth, microsoftProvider } from "./Firebase";
import { useNavigate } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Modal, Button } from "react-bootstrap"; // Import des composants Bootstrap

const MicrosoftLogin = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false); // État pour afficher/masquer la modale
    const [modalMessage, setModalMessage] = useState(""); // Message à afficher dans la modale
    const [modalType, setModalType] = useState("success"); // Type de modale (success, danger, etc.)

    const microsoftLogin = async () => {
        try {
            const loginResponse = await signInWithPopup(microsoftAuth, microsoftProvider);
            console.log(loginResponse);
            const user = loginResponse.user;
            const userData = {
                firstName: user.displayName,
                email: user.email,
                phone_number: user.phoneNumber,
                image: user.photoURL,
            };

            const response = await fetch('https://lavoro-back.onrender.com/users/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            // Vérifiez si la réponse est valide
            if (!response.ok) {
                const errorText = await response.text(); // Lisez le contenu de la réponse
                console.error('Server response:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Stockez le token dans le localStorage
            localStorage.setItem('token', data.token);

            // Afficher une modale de bienvenue
            setModalMessage("Welcome to Lavoro");
            setModalType("success");
            setShowModal(true);

            // Fermer la modale après 1 seconde
            setTimeout(() => {
                setShowModal(false);
                // Rediriger vers la page d'accueil après la fermeture de la modale
                navigate('/profile');
            }, 1000); // 1000 ms = 1 seconde
        } catch (error) {
            console.error('Error during Microsoft login:', error);
            setModalMessage("An error occurred during login. Please try again.");
            setModalType("danger");
            setShowModal(true);

            // Fermer la modale après 1 seconde
            setTimeout(() => {
                setShowModal(false);
            }, 1000); // 1000 ms = 1 seconde
        }
    };

    return (
        <>
            <div className="social-container">
                <button 
                    onClick={microsoftLogin}
                    className="btn btn-icon btn-wave btn-primary2-light"
                    style={{
                        position: "relative",
                        width: "20px", // Fixed size for all devices
                        height: "20px", // Fixed size for all devices
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                    }}
                >
                    <i className="ri-microsoft-line"></i>
                </button>
            </div>

            {/* Modale Bootstrap */}
            
        </>
    );
};

export default MicrosoftLogin;