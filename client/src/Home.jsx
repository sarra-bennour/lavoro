import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [userInfo, setUserInfo] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token retrieved from localStorage:', token);

                if (!token) {
                    console.warn('No token found in localStorage. Redirecting...');
                    setMessage('⚠️ No token found, redirecting...');
                    setTimeout(() => navigate('/signin'), 2000);
                    return;
                }

                console.log('Fetching user info with token:', token);

                const response = await axios.get('http://localhost:3000/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                console.log('User info fetched successfully:', response.data);

                if (response.data) {
                    setUserInfo(response.data);
                } else {
                    setMessage('❌ No user data received. Redirecting...');
                    setTimeout(() => navigate('/signin'), 2000);
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
                setMessage('❌ Error fetching user info. Redirecting...');
                setTimeout(() => navigate('/signin'), 2000);
            }
        };

        fetchUserInfo();
    }, [navigate]);

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Are you sure you want to log out?');
        const token = localStorage.getItem('token');

        if (!token) {
            setMessage('No token found. Redirecting to signin...');
            setTimeout(() => navigate('/signin'), 2000);
            return;
        }

        if (confirmLogout) {
            setIsLoggingOut(true);
            try {
                await axios.post('http://localhost:3000/users/logout', null, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                navigate('/auth');
            } catch (err) {
                setMessage('Logout failed. Please try again.');
                console.error('Logout failed:', err);
            } finally {
                localStorage.removeItem('token'); // Remove the token even if there's an error
                setIsLoggingOut(false);
            }
        }
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    const handleViewActivities = () => {
        navigate('/activities');
    };

    if (!userInfo) {
        return (
            <div className="loading-container">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="home-container">
            <h1 className="home-title">Welcome to LAVORO</h1>
            {message && <p className="message">{message}</p>}
            <div className="home-grid">
                <div className="home-profile">
                    <img
                        src={userInfo.image ? `http://localhost:3000${userInfo.image}` : '/default-profile.png'}
                        alt="Profile"
                        onError={(e) => {
                            e.target.src = '/default-profile.png';
                        }}
                    />
                </div>
                <div className="home-user-info">
                    <h3>First Name: <span>{userInfo.firstName}</span></h3>
                    <h3>Last Name: <span>{userInfo.lastName}</span></h3>
                    <h3>Email: <span>{userInfo.email}</span></h3>
                    <h3>Phone number: <span>{userInfo.phone_number}</span></h3>

                    <div className="home-buttons">
                        <button className="home-btn-primary" onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
                        </button>
                        <button className="home-btn-primary home-btn-outline" onClick={handleProfileClick}>
                            Profile
                        </button>
                        <button className="home-btn-primary home-btn-outline" onClick={handleViewActivities}>
                            View Activities
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;