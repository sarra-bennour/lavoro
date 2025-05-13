import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./sidebar"; // Import the Sidebar component
import Switcher from "./switcher";
import { Search, Globe, ShoppingCart, Bell, Maximize, Minimize, Settings } from "lucide-react";
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';
import { useTranslation } from "react-i18next";
import i18n from "./i18n"; // Adjust the path to your i18n.jsx file
import { format } from 'date-fns';

const Header = () => {
  const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);


// Add this function to your header component
const markAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    await axios.post(
      `http://localhost:3000/notifications/${notificationId}/mark-read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Update local state
    setNotifications(notifications.map(notif => 
      notif._id === notificationId ? { ...notif, is_read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};








useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Decode the token to get user ID
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload._id;

      const response = await axios.get(`http://localhost:3000/notifications?userId=${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  fetchNotifications();
  
  const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
  return () => clearInterval(interval);
}, []);



  const translatePage = async (targetLanguage) => {
    try {
      // Get all text content from the page
      const pageText = document.body.innerText;

      // Send the text to the LibreTranslate API for translation
      const response = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: pageText,
          source: "auto",
          target: targetLanguage,
        }),
      });

      const data = await response.json();
      const translatedText = data.translatedText;

      // Update the page content with the translated text
      document.body.innerText = translatedText;
    } catch (error) {
      console.error("Error translating page:", error);
    }
  };


  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [themeMode, setThemeMode] = useState("light");


  const navigate = useNavigate();

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsSidebarVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);




  useEffect(() => {
    // Load the Google Translate script dynamically
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  
    // Initialize the Google Translate widget
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en" },
        "google_translate_element"
      );
    };
  
    // Clean up the script when the component unmounts
    return () => {
      document.body.removeChild(script);
      delete window.googleTranslateElementInit;
    };
  }, []);

  const changeLanguage = (languageCode) => {
    const googleTranslateElement = document.querySelector(".goog-te-combo");
    if (googleTranslateElement) {
      googleTranslateElement.value = languageCode;
      googleTranslateElement.dispatchEvent(new Event("change"));
    }
  };


  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found in localStorage. Redirecting...");
          navigate("/signin");
          return;
        }

        const response = await axios.get("http://localhost:3000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data) {
          setUserInfo(response.data);
        } else {
          console.warn("No user data received. Redirecting...");
          navigate("/signin");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        navigate("/signin");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      navigate("/signin");
      return;
    }
  
    setIsLoggingOut(true);
    try {
      await axios.post("http://localhost:3000/users/logout", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      navigate("/signin");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const toggleThemeMode = () => {
    const newThemeMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newThemeMode);
    document.documentElement.setAttribute("data-theme-mode", newThemeMode);
    localStorage.setItem("xintradarktheme", newThemeMode === "dark");
  };

  useEffect(() => {
    const savedThemeMode = localStorage.getItem("xintradarktheme") === "true" ? "dark" : "light";
    setThemeMode(savedThemeMode);
    document.documentElement.setAttribute("data-theme-mode", savedThemeMode);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'not started':
        return 'primary';
      case 'in progress':
        return 'info';
      case 'done':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const renderNotificationContent = (notification) => {
    if (notification.type === 'TASK_ASSIGNMENT') {
      return (
        <div className="notification-item p-3 border-bottom">
          <div className="d-flex align-items-center mb-2">
            <div className="avatar avatar-sm avatar-rounded bg-primary-transparent me-2">
              <i className="ri-task-line"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0">New Task Assignment</h6>
              <small className="text-muted">
                {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
              </small>
            </div>
            {!notification.is_read && (
              <span className="badge bg-primary rounded-pill">New</span>
            )}
          </div>
          
          <div className="notification-content">
            <h6 className="mb-2">{notification.task_title}</h6>
            
            <div className="d-flex flex-wrap gap-2 mb-2">
              <div className="d-flex align-items-center">
                <i className="ri-calendar-line me-1"></i>
                <span className="text-muted">Start: {format(new Date(notification.task_start_date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="ri-calendar-check-line me-1"></i>
                <span className="text-muted">End: {format(new Date(notification.task_deadline), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            
            <div className="d-flex flex-wrap gap-2">
              <span className={`badge bg-${getPriorityColor(notification.task_priority)}-transparent`}>
                <i className="ri-flag-line me-1"></i>
                {notification.task_priority}
              </span>
              <span className={`badge bg-${getStatusColor(notification.task_status)}-transparent`}>
                <i className="ri-time-line me-1"></i>
                {notification.task_status}
              </span>
            </div>
          </div>
        </div>
      );
    } else if (notification.type === 'TASK_REMINDER') {
      return (
        <div className="notification-item p-3 border-bottom">
          <div className="d-flex align-items-center mb-2">
            <div className="avatar avatar-sm avatar-rounded bg-warning-transparent me-2">
              <i className="ri-alarm-warning-line"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0">Task Deadline Reminder</h6>
              <small className="text-muted">
                {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
              </small>
            </div>
            {!notification.is_read && (
              <span className="badge bg-warning rounded-pill">New</span>
            )}
          </div>
          
          <div className="notification-content">
            <h6 className="mb-2">{notification.task_title}</h6>
            <p className="text-muted mb-2">{notification.message}</p>
            
            <div className="d-flex flex-wrap gap-2">
              <span className={`badge bg-${getPriorityColor(notification.task_priority)}-transparent`}>
                <i className="ri-flag-line me-1"></i>
                {notification.task_priority}
              </span>
              <span className={`badge bg-${getStatusColor(notification.task_status)}-transparent`}>
                <i className="ri-time-line me-1"></i>
                {notification.task_status}
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="notification-item p-3 border-bottom">
        <p className="mb-0">{notification.notification_text}</p>
      </div>
    );
  };

  return (
   <>
    <header className="app-header sticky" id="header">
    {/* Start::main-header-container */}
    <div className="main-header-container container-fluid">
      {/* Start::header-content-left */}
      <div className="header-content-left">
        {/* Start::header-element */}
       
        {/* End::header-element */}
        {/* Start::header-element */}

            <div className="header-element mx-lg-0 mx-2">
              <a
                aria-label="Hide Sidebar"
                className="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle"
                href="javascript:void(0);"
                onClick={toggleSidebar}
              >
                <span />
              </a>
            </div>
            {/* End::header-element */}
        {/* Start::header-element */}
        
        {/* End::header-element */}
      </div>
      {/* End::header-content-left */}
      {/* Start::header-content-right */}
      <ul className="header-content-right">

      <li className="header-element" style={{ display: "none", alignItems: "center" }}>
  <div id="google_translate_element"></div>
</li>

        {/* Start::header-element */}
        <li className="header-element d-md-none d-block">
          <a
            href="javascript:void(0);"
            className="header-link"
            data-bs-toggle="modal"
            data-bs-target="#header-responsive-search"
          >
            {/* Start::header-link-icon */}
            <i className="ri-search-line header-link-icon" />
            {/* End::header-link-icon */}
          </a>
        </li>
        {/* End::header-element */}
        {/* Start::header-element */}
        <li className="header-element country-selector dropdown">
          {/* Start::header-link|dropdown-toggle */}
          <a
            href="javascript:void(0);"
            className="header-link dropdown-toggle"
            data-bs-auto-close="outside"
            data-bs-toggle="dropdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 header-link-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
              />
            </svg>
          </a>
          {/* End::header-link|dropdown-toggle */}
          <ul
            className="main-header-dropdown dropdown-menu dropdown-menu-end"
            data-popper-placement="none"
          >
            <li>
            <a
  className="dropdown-item d-flex align-items-center"
  href="javascript:void(0);"
  onClick={() => changeLanguage("en")} // Trigger translation to English
>
  <div className="d-flex align-items-center justify-content-between">
    <div className="d-flex align-items-center">
      <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
        <img src="../assets/images/flags/us.jpeg" alt="img" />
      </span>
      English
    </div>
  </div>
</a>
            </li>
            <li>
            <a
                    className="dropdown-item d-flex align-items-center"
                    href="javascript:void(0);"
                    onClick={() => changeLanguage("es")} // Translate to English
                  >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/spain.jpeg" alt="img" />
                </span>
                español
              </a>
            </li>
            <li>
            <a
                    className="dropdown-item d-flex align-items-center"
                    href="javascript:void(0);"
                    onClick={() => changeLanguage("fr")} // Translate to English
                  >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/fr.png" alt="img" />
                </span>
                français
              </a>
            </li>
            <li>
            <a
                    className="dropdown-item d-flex align-items-center"
                    href="javascript:void(0);"
                    onClick={() => changeLanguage("ar")} // Translate to English
                  >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/arabe.png" alt="img" />
                </span>
                عربي
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="javascript:void(0);"
                onClick={() => changeLanguage("de")} 
              >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img
                    src="../assets/images/flags/germany.jpeg"
                    alt="img"
                  />
                </span>
                Deutsch
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="javascript:void(0);"
                onClick={() => changeLanguage("zh-CN")} 
              >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/china.jpeg" alt="img" />
                </span>
                中国人
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="javascript:void(0);"
                onClick={() => changeLanguage("it")} 
              >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/italia.jpeg" alt="img" />
                </span>
                Italiano
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="javascript:void(0);"
                onClick={() => changeLanguage("ru")} 
              >
                <span className="avatar avatar-rounded avatar-xs lh-1 me-2">
                  <img src="../assets/images/flags/russia.webp" alt="img" />
                </span>
                Русский
              </a>
            </li>
          </ul>
        </li>
        {/* End::header-element */}
        {/* Start::header-element */}
           <li className="header-element header-theme-mode">
              <a
                href="javascript:void(0);"
                className="header-link layout-setting"
                onClick={toggleThemeMode}
              >
                <span className={themeMode === "light" ? "light-layout" : "dark-layout"}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 header-link-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    {themeMode === "light" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                      />
                    )}
                  </svg>
                </span>
              </a>
            </li>
        {/* End::header-element */}
        {/* Start::header-element */}
        
        {/* Start::header-element */}
        <li className="header-element notifications-dropdown d-xl-block d-none dropdown">
          {/* Start::header-link|dropdown-toggle */}
          <a
            href="javascript:void(0);"
            className="header-link dropdown-toggle"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
            id="messageDropdown"
            aria-expanded="false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 header-link-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
              />
            </svg>
            <span className="header-icon-pulse bg-primary2 rounded pulse pulse-secondary" />
          </a>
          {/* End::header-link|dropdown-toggle */}
          {/* Start::main-header-dropdown */}
          <div
            className="main-header-dropdown dropdown-menu dropdown-menu-end"
            data-popper-placement="none"
          >
            <div className="p-3">
              <div className="d-flex align-items-center justify-content-between">
                <p className="mb-0 fs-15 fw-medium">Notifications</p>
<span className="badge bg-primary text-fixed-white">
  {unreadCount} Unread
</span>
              </div>
            </div>
            <div className="dropdown-divider" />
            <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    {renderNotificationContent(notification)}
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-muted">
                  <i className="ri-notification-off-line fs-4 mb-2"></i>
                  <p className="mb-0">No notifications</p>
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-2 border-top text-center">
                <button className="btn btn-sm btn-light-primary w-100">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
          {/* End::main-header-dropdown */}
        </li>
        {/* End::header-element */}
        {/* Start::header-element */}
        <li className="header-element header-fullscreen">
          {/* Start::header-link */}
          <a
            onClick={toggleFullScreen}
            href="javascript:void(0);"
            className="header-link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 full-screen-open header-link-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 full-screen-close header-link-icon d-none"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
              />
            </svg>
            </a>
          {/* End::header-link */}
        </li>
        {/* End::header-element */}
        {/* Start::header-element */}
        <li className="header-element dropdown">
              <a
                href="javascript:void(0);"
                className="header-link dropdown-toggle"
                id="mainHeaderProfile"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <div className="d-flex align-items-center">
                  <div>
                  <img
  src={
    userInfo?.image
      ? userInfo.image.startsWith('http') || userInfo.image.startsWith('https')
        ? userInfo.image // Use as-is if it's already a full URL
        : `http://localhost:3000${userInfo.image}` // Prepend server URL if relative
      : "../assets/images/faces/15.jpg" // Fallback if no image
  }
  alt="Profile"
  className="avatar avatar-sm"
  onError={(e) => {
    e.target.src = "../assets/images/faces/15.jpg";
  }}
/>
              </div>
            </div>
          </a>
          {/* End::header-link|dropdown-toggle */}
          <ul
            className="main-header-dropdown dropdown-menu pt-0 overflow-hidden header-profile-dropdown dropdown-menu-end"
            aria-labelledby="mainHeaderProfile"
          >
            <li>
            <div className="dropdown-item text-center border-bottom">
                    <span>{userInfo?.firstName || "Mr. Henry"}</span>
                    <span className="d-block fs-12 text-muted">
                    {userInfo?.role?.RoleName || "UI/UX Designer"}
                    </span>
                  </div>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="/profile"
              >
                <i className="ri-user-line p-1 rounded-circle bg-primary-transparent me-2 fs-16" />
                Profile
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="/mail"
              >
                <i className="ri-mail-line p-1 rounded-circle bg-primary-transparent me-2 fs-16" />
                Mail Inbox
              </a>
            </li>
            <li>
              <a
                className="dropdown-item d-flex align-items-center"
                href="/file"
              >
                <i className="ri-database-line p-1 rounded-circle bg-primary-transparent klist me-2 fs-16" />
                File Manger
                <span className="badge bg-primary1 text-fixed-white ms-auto fs-9">
                  2
                </span>
              </a>
            </li>
            
            
            <li>
            <a
                    className="dropdown-item d-flex align-items-center"
                    href="javascript:void(0);"
                    onClick={handleLogout}
                  >
                    <i className="ri-lock-line p-1 rounded-circle bg-primary-transparent ut me-2 fs-16" />
                    {isLoggingOut ? "Logging Out..." : "Log Out"}
                  </a>
            </li>
          </ul>
        </li>
        {/* End::header-element */}
        {/* Start::header-element */}
        <li className="header-element">
          {/* Start::header-link|switcher-icon */}
          <a
            href="javascript:void(0);"
            className="header-link switcher-icon"
            data-bs-toggle="offcanvas"
            data-bs-target="#switcher-canvas"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 header-link-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </a>
          {/* End::header-link|switcher-icon */}
        </li>
        {/* End::header-element */}
      </ul>
      {/* End::header-content-right */}
    </div>
  </header>


      {/* Render the Sidebar conditionally */}
      <div
        className={`sidebar-wrapper ${isSidebarVisible ? "visible" : "hidden"}`}
        ref={sidebarRef}
      >
<Sidebar userRole={userInfo?.role?.RoleName} />
</div>

      {/* Overlay for closing the sidebar */}
      {isSidebarVisible && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Header;