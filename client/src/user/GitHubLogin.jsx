import { signInWithPopup } from "firebase/auth";
import { githubAuth, githubProvider } from "./Firebase"
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
const GitHubLogin = () => {
  
  const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false); // État pour afficher/masquer la modale
    const [modalMessage, setModalMessage] = useState(""); // Message à afficher dans la modale
    const [modalType, setModalType] = useState("success"); // Type de modale (success, danger, etc.)
  const githHubLogin = async () => {
    try {
      const loginResponse = await signInWithPopup(githubAuth, githubProvider);
      const user = loginResponse.user
      const userData = {
        firstName: user.displayName,
        email: user.email,
        phone_number: user.phoneNumber,
        image: user.photoURL,
    }
    const response = await fetch('https://lavoro-back.onrender.com/users/github', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
  }); // Vérifiez si la réponse est valide
  if (!response.ok) {
      const errorText = await response.text(); // Lisez le contenu de la réponse
      console.error('Server response:', errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('Login successful:', data);

  // Stockez le token dans le localStorage
  localStorage.setItem('token', data.token);


  // Fermer la modale après 1 seconde
  setTimeout(() => {
   
      navigate('/profile');
  }, 1000); // 1000 ms = 1 seconde
} catch (error) {
  console.error('Error during Microsoft login:', error);

  // Fermer la modale après 1 seconde
  setTimeout(() => {
      setShowModal(false);
  }, 1000); // 1000 ms = 1 seconde
}
  };

  
  return (
    <>
    <div className="social-container">
      <a href="#" onClick={githHubLogin}
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
    }}>
        <i className="ri-github-line" ></i> 
      </a>
    </div>

    {/* Modale Bootstrap */}
    
    </>
  );
};

export default GitHubLogin;