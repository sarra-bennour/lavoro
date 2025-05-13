import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import Loader from "./loader";
import Switcher from "./switcher";
import ResponsiveSearchModal from "./responsive-search-modal";
import CommonJs from "./commonjs";
import MainHead from "./mainhead";
import ChatPopup from "../chat/ChatPopup";
import * as chatClient from "../chat/chatClient.js";
import CreateGroupModal from "../chat/CreateGroupModal";

const Layout = () => {
  const [loading, setLoading] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const location = useLocation();

  // Get current user from localStorage
  useEffect(() => {
    const fetchUser = async () => {
      const userString = localStorage.getItem('user');
      let user = userString ? JSON.parse(userString) : null;

      if (!user) {
        const userInfoString = localStorage.getItem('userInfo');
        const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
        user = userInfo?.user || userInfo;
      }

      if (user && user._id) {
        setCurrentUser(user);
        // Connect to socket
        chatClient.connectSocket(user._id);
      }
    };

    fetchUser();
  }, []);

  // Close chat popup when navigating to chat page
  useEffect(() => {
    if (location.pathname === '/chat') {
      setShowChatPopup(false);
    }
  }, [location.pathname]);

  const handleGroupCreated = (newGroup) => {
    setShowCreateGroupModal(false);
  };

  const toggleChatPopup = () => {
    setShowChatPopup(!showChatPopup);
  };

  return (
    <>
      {loading && <Loader />}
      <div className="page">
        <MainHead />
        <Switcher />
        <Header /> {/* Sidebar is now handled inside the Header component */}
        <div className="main-content app-content">
          <div className="container-fluid">
            {/* Outlet will render the matched child route */}
            <Outlet />
          </div>
        </div>
        <Footer />
        <ResponsiveSearchModal />

        {/* Chat Button */}
        {currentUser && location.pathname !== '/chat' && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#4a6bff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              zIndex: 1030,
              transition: 'all 0.3s ease',
              fontSize: '24px'
            }}
            onClick={toggleChatPopup}
          >
            <i className="ri-chat-3-line"></i>
          </div>
        )}

        {/* Chat Popup */}
        {showChatPopup && currentUser && (
          <>
            <ChatPopup
              onClose={() => setShowChatPopup(false)}
              currentUser={currentUser}
              onCreateGroup={() => setShowCreateGroupModal(true)}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
              isOpen={showCreateGroupModal}
              onClose={() => setShowCreateGroupModal(false)}
              onGroupCreated={handleGroupCreated}
              currentUser={currentUser}
              contacts={{}}
            />
          </>
        )}
      </div>
      <CommonJs />
    </>
  );
};

export default Layout;