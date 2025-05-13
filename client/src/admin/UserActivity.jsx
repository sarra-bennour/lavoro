import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function UserActivity() {
  const { userId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user activity data
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        console.log('Fetching user activity...');
        const response = await axios.get(`https://lavoro-back.onrender.com/admin/user-activity/${userId}`, {
          withCredentials: true,
        });

        console.log('API Response:', response.data);

        // Transform the API data into the expected format
        const transformedActivities = response.data.activityLogs.map((log, index) => ({
          title: log.action,
          description: `${log.userId.firstName} ${log.userId.lastName}`,
          date: new Date(log.timestamp).toLocaleDateString(),
          day: new Date(log.timestamp).toLocaleString('en-US', { weekday: 'long' }),
          time: new Date(log.timestamp).toLocaleTimeString(),
          avatar: log.userId.image, // Use the actual user image
          borderColor: `primary${index % 4 + 1}`,
          user: log.userId // Store the full user object
        }));
        
        setActivities(transformedActivities);
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError('Failed to fetch user activity.');
      } finally {
        console.log('Loading complete.');
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center">
        <button className="btn btn-success-light btn-loader mx-auto">
          <span className="me-2">Loading</span>
          <span className="loading"><i className="ri-loader-4-line fs-16"></i></span>
        </button>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger">{error}</p>;
  }

  if (!loading && activities.length === 0) {
    return <p className="text-center text-muted">No activities found for this user.</p>;
  }

  return (
    <div className="row justify-content-center timeline-2">
      <div className="col-xxl-11">
        <div className="card custom-card">
          <div className="card-header justify-content-between">
            <div className="card-title">User Activity Timeline</div>
          </div>
          <ul className="notification container px-3">
            {activities.map((activity, index) => (
              <li key={index}>
                <div className="row">
                  {/* Left Side (Even Index) */}
                  {index % 2 === 0 && (
                    <>
                      <div className="col-xl-6">
                        <div
                          className={`notification-body border border-${activity.borderColor} border-opacity-50`}
                        >
                          <div className="d-flex align-items-start gap-3 flex-wrap">
                            <div>
                              <span className="avatar avatar-lg online">
                                <img
                                  src={
                                    activity.user?.image
                                      ? activity.user.image.startsWith('http') || 
                                        activity.user.image.startsWith('https')
                                        ? activity.user.image
                                        : `https://lavoro-back.onrender.com${activity.user.image}`
                                      : 'https://via.placeholder.com/50'
                                  }
                                  alt={`${activity.user?.firstName || ''} ${activity.user?.lastName || ''}`}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/50';
                                  }}
                                />
                              </span>
                            </div>
                            <div className="flex-fill w-50">
                              <h5 className="mb-1 fs-15 fw-medium text-dark">{activity.title}</h5>
                              <p className="mb-0 text-muted">{activity.description}</p>
                            </div>
                            <div>
                              <span className={`badge bg-${activity.borderColor}-transparent`}>
                                {activity.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="notification-time d-flex align-items-center gap-2">
                          <span className="date">{activity.day}</span>
                          <span className="time">{activity.time}</span>
                        </div>
                        <div className="notification-icon">
                          <a href="javascript:void(0);" className={activity.borderColor}></a>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Right Side (Odd Index) */}
                  {index % 2 !== 0 && (
                    <>
                      <div className="col-xl-6">
                        <div className="notification-time d-flex align-items-center gap-2 content-end">
                          <span className="date">{activity.day}</span>
                          <span className="time">{activity.time}</span>
                        </div>
                        <div className="notification-icon">
                          <a href="javascript:void(0);" className={activity.borderColor}></a>
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div
                          className={`notification-body notification-body-end border border-${activity.borderColor} border-opacity-50`}
                        >
                          <div className="d-flex align-items-start gap-3 flex-wrap">
                            <div>
                              <span className="avatar avatar-lg online">
                                <img
                                  src={
                                    activity.user?.image
                                      ? activity.user.image.startsWith('http') || 
                                        activity.user.image.startsWith('https')
                                        ? activity.user.image
                                        : `https://lavoro-back.onrender.com${activity.user.image}`
                                      : 'https://via.placeholder.com/50'
                                  }
                                  alt={`${activity.user?.firstName || ''} ${activity.user?.lastName || ''}`}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/50';
                                  }}
                                />
                              </span>
                            </div>
                            <div className="flex-fill w-50">
                              <h5 className="mb-1 fs-15 fw-medium text-dark">{activity.title}</h5>
                              <p className="mb-0 text-muted">{activity.description}</p>
                            </div>
                            <div>
                              <span className={`badge bg-${activity.borderColor}-transparent`}>
                                {activity.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="text-center mb-4">
            <button className="btn btn-success-light btn-loader mx-auto">
              <span className="me-2">Loading</span>
              <span className="loading"><i className="ri-loader-4-line fs-16"></i></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserActivity;