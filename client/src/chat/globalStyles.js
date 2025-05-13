// Styles globaux pour le chat
const addGlobalStyles = () => {
  // Créer un élément style
  const style = document.createElement('style');

  // Définir les styles
  style.textContent = `
    /* Style pour rendre les actions de message visibles au survol */
    .main-chat-msg {
      position: relative;
    }

    .main-chat-msg:hover .hover-visible {
      opacity: 1 !important;
    }

    /* Styles pour les messages de chat */
    .chat-window {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #ffffff;
    }

    .chat-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background-color: #ffffff;
    }

    .chat-footer {
      padding: 15px;
      border-top: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }

    /* Styles pour les bulles de message */
    .chat-item-start .main-chat-msg {
      background-color: #f0f2f5;
      color: #212529;
      border-radius: 12px 12px 12px 0;
      padding: 10px 15px;
      position: relative;
      max-width: 75%;
      margin-bottom: 10px;
    }

    .chat-item-end .main-chat-msg {
      background-color: #4a6bff;
      color: #fff;
      border-radius: 12px 12px 0 12px;
      padding: 10px 15px;
      position: relative;
      max-width: 75%;
      margin-bottom: 10px;
      margin-left: auto;
    }

    /* Styles pour l'input de chat */
    .chat-input-container {
      position: relative;
    }

    .chat-input {
      background-color: #ffffff;
      border: 1px solid #ced4da;
      color: #212529;
      border-radius: 24px;
      padding: 10px 50px 10px 15px;
      width: 100%;
    }

    .chat-input:focus {
      outline: none;
      border-color: #4a6bff;
      box-shadow: 0 0 0 0.25rem rgba(74, 107, 255, 0.25);
    }

    .chat-send-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background-color: #4a6bff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .chat-send-btn:hover {
      background-color: #3a5bef;
    }

    /* Styles pour les actions de chat */
    .chat-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .chat-action-btn {
      background-color: #f8f9fa;
      color: #6c757d;
      border: 1px solid #ced4da;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chat-action-btn:hover {
      background-color: #e9ecef;
      color: #212529;
    }
  `;

  // Ajouter le style au head du document
  document.head.appendChild(style);
};

export default addGlobalStyles;
