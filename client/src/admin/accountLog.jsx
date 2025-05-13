import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function UserActivityLog() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [error, setError] = useState(null);
  const { userId } = useParams(); // Get the userId from the URL
  const navigate = useNavigate();

  // Fetch activity logs on component mount
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await axios.get(`https://lavoro-back.onrender.com/admin/user-activity/${userId}`, {
          withCredentials: true, // Include cookies
        });
        setActivityLogs(response.data.activityLogs);
      } catch (err) {
        setError('Failed to fetch activity logs. Please try again.');
        console.error('Error fetching activity logs:', err);
      }
    };

    fetchActivityLogs();
  }, [userId]);

  // Handle navigation back to the admin dashboard
  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="container" style={{ marginTop: '50px', padding: '40px' }}>
      <h1>User Activity Log</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Activity Logs</h2>

      {/* Scrollable container for the activity logs */}
      <div
        style={{
          maxHeight: '500px', // Set a maximum height for the scrollable area
          overflowY: 'auto', // Enable vertical scrolling
          border: '1px solid #ddd', // Optional: Add a border
          borderRadius: '5px', // Optional: Add rounded corners
          padding: '10px', // Optional: Add padding
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <li
                key={log._id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ marginLeft: '10px' }}>
                  <p>
                    <strong>User:</strong> {log.userId.firstName} {log.userId.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {log.userId.email}
                  </p>
                  <p>
                    <strong>Action:</strong> {log.action}
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <p>No activity logs found.</p>
          )}
        </ul>
      </div>

      <button
        onClick={handleBackToDashboard}
        style={{
          borderRadius: '20px',
          border: '1px solid #FF4B2B',
          backgroundColor: '#FF4B2B',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '12px 45px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          transition: 'transform 80ms ease-in',
          marginTop: '20px',
          cursor: 'pointer',
        }}
        onMouseDown={(e) => (e.target.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
      >
        Back to Dashboard
      </button>
    </div>
  );

}

export default UserActivityLog;