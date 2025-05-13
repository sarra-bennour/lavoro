import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import UpdateProfile from "./updateProfile";
import ProfileSecurity from "./profileSecurity";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile-about-tab-pane");
  const [tasks, setTasks] = useState([]);

  // Fetch user info on component mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data) {
          // Parse the skills field to handle any potential stringified data
          let fetchedSkills = response.data.skills;
          console.log("Raw skills from API in Profile:", fetchedSkills);

          if (typeof fetchedSkills === 'string') {
            try {
              fetchedSkills = JSON.parse(fetchedSkills);
              if (typeof fetchedSkills === 'string') {
                fetchedSkills = JSON.parse(fetchedSkills);
              }
            } catch (e) {
              console.error("Error parsing skills in Profile:", e);
              fetchedSkills = [];
            }
          }

          fetchedSkills = Array.isArray(fetchedSkills) ? fetchedSkills : [];
          console.log("Parsed skills in Profile:", fetchedSkills);

          setUser({ ...response.data, skills: fetchedSkills });

          // Check if we came from the award page
          console.log("Navigation state:", location.state);

          if (location.state && location.state.showAward && location.state.awardDetails) {
            // Show a notification about the new award
            setTimeout(() => {
              alert(`Congratulations! You've received a new award: ${location.state.awardDetails.name}`);
              // Set the active tab to profile-about-tab-pane to show the awards section
              setActiveTab("profile-about-tab-pane");
            }, 500);
          }
        } else {
          navigate("/signin");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/signin");
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchUserInfo();

    return () => clearTimeout(timeout);
  }, [navigate, location]);

  // Fonction pour récupérer les activités
  // const fetchActivities = async () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) {
  //       console.error("No token found");
  //       navigate('/auth');
  //       return;
  //     }

  //     const response = await axios.get('https://lavoro-back.onrender.com/tasks/my-tasks', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       withCredentials: true
  //     });

  //     console.log("Tasks response:", response.data);
  //     setTasks(response.data);

  //   } catch (err) {
  //     console.error("Full error:", err);
  //     console.error("Error response:", err.response?.data);

  //     if (err.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       navigate('/signin');
  //     } else {
  //       alert(`Error: ${err.response?.data?.message || err.message}`);
  //     }
  //     setTasks([]);
  //   }
  // };


  const fetchActivities = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      navigate('/auth');
      return;
    }

    const response = await axios.get('https://lavoro-back.onrender.com/tasks/my-tasks', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log("Tasks response:", response.data);
    
    // Ensure we're setting an array
    const tasksData = Array.isArray(response.data) ? response.data : 
                     (response.data.tasks || response.data.data || []);
    
    setTasks(tasksData);

  } catch (err) {
    console.error("Full error:", err);
    console.error("Error response:", err.response?.data);
    
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/signin');
    } else {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
    setTasks([]); // Set to empty array on error
  }
};

  // Charger les activités lorsque l'onglet est activé
  useEffect(() => {
    if (activeTab === "activities-tab-pane") {
      fetchActivities();
    }
  }, [activeTab]);

  // Enable 2FA
  const handleEnable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/enable-2fa",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setQrCodeUrl(response.data.qrCodeUrl);
      setShowQRCode(true);
    } catch (err) {
      console.error("Error enabling 2FA:", err);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error("No token found");
      }

      const userProvidedToken = token;
      console.log('Sending verify request with TOTP code:', userProvidedToken);

      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/verify-2fa",
        { token: userProvidedToken },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          withCredentials: true,
        }
      );

      console.log('Verify response:', response.data);
      setMessage(response.data.message);
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setMessage(err.response?.data?.error || "Error verifying 2FA");
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/disable-2fa",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setMessage(response.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error disabling 2FA");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
      <div>
        <nav>
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item">
              <a href="#" onClick={(e) => e.preventDefault()}>
                Pages
              </a>
            </li>
            <span className="mx-1">→</span>
            <li className="breadcrumb-item active" aria-current="page">
              Profile
            </li>
          </ol>
        </nav>
        <h1 className="page-title fw-medium fs-18 mb-0">Profile</h1>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card profile-card">
            <ProfileBanner />
            <div className="card-body pb-0 position-relative">
              <div className="row profile-content">
                {activeTab !== "edit-profile-tab-pane" && (
                  <div className="col-xl-3">
                    <ProfileSidebar user={user} />
                  </div>
                )}
                <div className={activeTab === "edit-profile-tab-pane" ? "col-xl-12" : "col-xl-9"}>
                  <div className="card custom-card overflow-hidden border">
                    <div className="card-body">
                      <ul className="nav nav-tabs tab-style-6 mb-3 p-0" id="myTab" role="tablist">
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link w-100 text-start ${activeTab === "profile-about-tab-pane" ? "active" : ""}`}
                            id="profile-about-tab"
                            onClick={() => {
                              setActiveTab("profile-about-tab-pane");
                            }}
                            type="button"
                            role="tab"
                            aria-controls="profile-about-tab-pane"
                            aria-selected={activeTab === "profile-about-tab-pane"}
                          >
                            About
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link w-100 text-start ${activeTab === "edit-profile-tab-pane" ? "active" : ""}`}
                            id="edit-profile-tab"
                            onClick={() => setActiveTab("edit-profile-tab-pane")}
                            type="button"
                            role="tab"
                            aria-controls="edit-profile-tab-pane"
                            aria-selected={activeTab === "edit-profile-tab-pane"}
                          >
                            Edit Profile
                          </button>
                        </li>
                        {user?.role?.RoleName === "Developer" && (
                          <li className="nav-item" role="presentation">
                            <button
                              className={`nav-link w-100 text-start ${activeTab === "activities-tab-pane" ? "active" : ""}`}
                              id="activities-tab"
                              onClick={() => setActiveTab("activities-tab-pane")}
                              type="button"
                              role="tab"
                              aria-controls="activities-tab-pane"
                              aria-selected={activeTab === "activities-tab-pane"}
                            >
                              See Activities
                            </button>
                          </li>
                        )}
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link w-100 text-start ${activeTab === "security-tab-pane" ? "active" : ""}`}
                            id="security-tab"
                            onClick={() => setActiveTab("security-tab-pane")}
                            type="button"
                            role="tab"
                            aria-controls="security-tab-pane"
                            aria-selected={activeTab === "security-tab-pane"}
                          >
                            Security
                          </button>
                        </li>
                      </ul>
                      <div className="tab-content" id="profile-tabs">
                        <div
                          className={`tab-pane p-0 border-0 ${activeTab === "profile-about-tab-pane" ? "show active" : ""}`}
                          id="profile-about-tab-pane"
                          role="tabpanel"
                          aria-labelledby="profile-about-tab"
                          tabIndex={0}
                        >
                          <AboutTab user={user} />
                        </div>
                        <div
                          className={`tab-pane p-0 border-0 ${activeTab === "edit-profile-tab-pane" ? "show active" : ""}`}
                          id="edit-profile-tab-pane"
                          role="tabpanel"
                          aria-labelledby="edit-profile-tab"
                          tabIndex={0}
                        >
                          <UpdateProfile />
                        </div>
                        <div
                          className={`tab-pane p-0 border-0 ${activeTab === "activities-tab-pane" ? "show active" : ""}`}
                          id="activities-tab-pane"
                          role="tabpanel"
                          aria-labelledby="activities-tab"
                          tabIndex={0}
                        >
                          <div className="container activities-container">
                            <h1 className="text-center mb-4">My Activities</h1>
                            <div className="table-responsive">
                              <table className="table table-striped table-hover">
                                <thead className="thead-dark">
                                  <tr>
                                    <th scope="col">Title</th>
                                    <th scope="col">Description</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Priority</th>
                                    <th scope="col">Start Date</th>
                                    <th scope="col">End Date</th>
                                    <th scope="col">Estimated Duration</th>
                                    <th scope="col">Tags</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tasks.map(task => (
                                    <tr key={task._id}>
                                      <td>{task.title}</td>
                                      <td>{task.description}</td>
                                      <td>
                                        <span className={`badge ${task.status === 'Completed' ? 'bg-success' : task.status === 'In Progress' ? 'bg-warning' : 'bg-secondary'}`}>
                                          {task.status}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                                          {task.priority}
                                        </span>
                                      </td>
                                      <td>{new Date(task.start_date).toLocaleDateString()}</td>
                                      <td>{new Date(task.deadline).toLocaleDateString()}</td>
                                      <td>{task.estimated_duration} jours</td>
                                      <td>
                                        {task.tags && task.tags.join(', ')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`tab-pane p-0 border-0 ${activeTab === "security-tab-pane" ? "show active" : ""}`}
                          id="security-tab-pane"
                          role="tabpanel"
                          aria-labelledby="security-tab"
                          tabIndex={0}
                        >
                          <ProfileSecurity
                            user={user}
                            handleEnable2FA={handleEnable2FA}
                            handleVerify2FA={handleVerify2FA}
                            handleDisable2FA={handleDisable2FA}
                            qrCodeUrl={qrCodeUrl}
                            showQRCode={showQRCode}
                            token={token}
                            setToken={setToken}
                            message={message}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ProfileBanner Component
const ProfileBanner = () => {
  return (
    <div className="profile-banner-img">
      <img src="/assets/images/media/media-3.jpg" className="card-img-top" alt="..." />
    </div>
  );
};

// ProfileSidebar Component
const ProfileSidebar = ({ user }) => {
  return (
    <div className="card custom-card overflow-hidden border">
      <div className="card-body border-bottom border-block-end-dashed">
        <div className="text-center">
          <span className="avatar avatar-xxl avatar-rounded online mb-3">
            {user.image ? (
              <img
                src={
                  user?.image
                    ? user.image.startsWith('http') || user.image.startsWith('https')
                      ? user.image
                      : `https://lavoro-back.onrender.com${user.image}`
                    : "https://via.placeholder.com/100"
                }
                alt="Profile"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "10px"
                }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/100";
                }}
              />
            ) : (
              <p>No profile image uploaded.</p>
            )}
          </span>
          <h5 className="fw-semibold mb-1">{user.firstName}</h5>
          <h5 className="fw-semibold mb-1">{user.lastName}</h5>
          <span className="d-block fw-medium text-muted mb-2">{user.role?.RoleName}</span>
          <p className="fs-12 mb-0 text-muted">
            <span className="me-3">
              <i className="ri-building-line me-1 align-middle"></i>Tunisia
            </span>
            <span>
              <i className="ri-map-pin-line me-1 align-middle"></i>Bizerte
            </span>
          </p>
        </div>
      </div>
      <div className="p-3 pb-1 d-flex flex-wrap justify-content-between">
        <div className="fw-medium fs-15 text-primary1">Basic Info :</div>
      </div>
      <div className="card-body border-bottom border-block-end-dashed p-0">
        <ul className="list-group list-group-flush">
          <li className="list-group-item pt-2 border-0">
            <div>
              <span className="fw-medium me-2">Name :</span>
              <span className="text-muted">{user.firstName + " " + user.lastName}</span>
            </div>
          </li>
          <li className="list-group-item pt-2 border-0">
            <div>
              <span className="fw-medium me-2">Role :</span>
              <span className="text-muted">{user.role?.RoleName}</span>
            </div>
          </li>
          <li className="list-group-item pt-2 border-0">
            <div>
              <span className="fw-medium me-2">Email :</span>
              <span className="text-muted">{user.email}</span>
            </div>
          </li>
          <li className="list-group-item pt-2 border-0">
            <div>
              <span className="fw-medium me-2">Phone :</span>
              <span className="text-muted">+216  {user.phone_number}</span>
            </div>
          </li>

          
        </ul>
      </div>
    </div>
  );
};

// AboutTab Component
const AboutTab = ({ user }) => {
  // Robustly parse skills for display (like in UpdateProfile)
  let skillsToDisplay = [];
  if (user.skills) {
    let fetchedSkills = user.skills;
    if (Array.isArray(fetchedSkills) && fetchedSkills.length === 1 && typeof fetchedSkills[0] === 'string') {
      const first = fetchedSkills[0].trim();
      if (first.startsWith('[') && first.endsWith(']')) {
        try {
          fetchedSkills = JSON.parse(first);
        } catch (e) {
          fetchedSkills = [];
        }
      } else {
        fetchedSkills = first.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (typeof fetchedSkills === 'string') {
      try {
        fetchedSkills = JSON.parse(fetchedSkills);
        if (typeof fetchedSkills === 'string') {
          fetchedSkills = JSON.parse(fetchedSkills);
        }
      } catch (e) {
        fetchedSkills = [];
      }
    }
    skillsToDisplay = Array.isArray(fetchedSkills) ? fetchedSkills : [];
  }

  // Debug the skills being displayed
  console.log("Skills to display in AboutTab:", skillsToDisplay);

  // Color palette for badges
  const colorPalette = [
    '#e57373', // red
    '#64b5f6', // blue
    '#81c784', // green
    '#ffd54f', // yellow
    '#ba68c8', // purple
    '#4dd0e1', // teal
    '#ffb74d', // orange
    '#a1887f', // brown
    '#90a4ae', // grey
    '#f06292', // pink
  ];

  // Get a color for each skill by index
  const getSkillColor = (index) => colorPalette[index % colorPalette.length];

  return (
    <ul className="list-group list-group-flush border rounded-3">
      <li className="list-group-item p-3">
        <span className="fw-medium fs-15 d-block mb-3">Profile Info :</span>
        <div className="text-muted">
          <p className="mb-3">
            <span className="avatar avatar-sm avatar-rounded text-primary p-1 bg-primary-transparent me-2">
              <i className="ri-mail-line align-middle fs-15"></i>
            </span>
            <span className="fw-medium text-default">Email : </span> {user.email}
          </p>
          <p className="mb-3">
            <span className="avatar avatar-sm avatar-rounded text-primary1 p-1 bg-primary1-transparent me-2">
              <i className="ri-map-pin-line align-middle fs-15"></i>
            </span>
            <span className="fw-medium text-default">Role : </span> {user.role?.RoleName}
          </p>
          
          <p className="mb-0">
            <span className="avatar avatar-sm avatar-rounded text-primary3 p-1 bg-primary3-transparent me-2">
              <i className="ri-phone-line align-middle fs-15"></i>
            </span>
            <span className="fw-medium text-default">Phone : </span> +216 {user.phone_number}
          </p>
        </div>
      </li>
      <li className="list-group-item p-3">
        <span className="fw-medium fs-15 d-block mb-3">Description :</span>
        <div className="text-muted">
          {user.description ? (
            <p>{user.description}</p>
          ) : (
            <span className="text-muted">No description available.</span>
          )}
        </div>
      </li>
      <li className="list-group-item p-3">
        <span className="fw-medium fs-15 d-block mb-3">Skills :</span>
        <p className="text-muted mb-3">Here are the key skills that define my expertise:</p>
        <div className="w-75 d-flex flex-wrap">
          {skillsToDisplay && skillsToDisplay.length > 0 ? (
            skillsToDisplay.map((skill, index) => (
              <a href="#" onClick={(e) => e.preventDefault()} key={index}>
                <span
                  className="badge text-white m-1 border"
                  style={{ backgroundColor: getSkillColor(index), border: 'none' }}
                >
                  {skill}
                </span>
              </a>
            ))
          ) : (
            <span className="text-muted">No skills available.</span>
          )}
        </div>
      </li>

      {/* New Awards/Badges section */}
      <li className="list-group-item p-3">
        <span className="fw-medium fs-15 d-block mb-3">Awards & Achievements :</span>
        <p className="text-muted mb-3">Recognition for outstanding performance and contributions:</p>

        {user.awards && user.awards.length > 0 ? (
          <div className="awards-container">
            {user.awards.map((award, index) => (
              <div key={index} className="award-badge mb-3">
                <div className="d-flex align-items-center">
                  <div className="award-icon me-3">
                    <span className={`avatar avatar-md ${
                      award.name === 'Top Performer' ? 'bg-warning' :
                      award.name === 'Silver Performer' ? 'bg-secondary' :
                      award.name === 'Bronze Performer' ? 'bg-danger' : 'bg-primary'
                    }`}>
                      <i className={award.icon || 'ri-award-line'} style={{ fontSize: '24px' }}></i>
                    </span>
                  </div>
                  <div className="award-details">
                    <h6 className="mb-1">{award.name}</h6>
                    <p className="text-muted mb-1">{award.description}</p>
                    <small className="text-muted">
                      Awarded on {new Date(award.date).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mb-3">
              <i className="ri-award-line" style={{ fontSize: '48px', opacity: '0.5' }}></i>
            </div>
            <p className="text-muted">No awards received yet. Keep up the good work!</p>
          </div>
        )}

        <style jsx>{`
          .award-badge {
            padding: 15px;
            border-radius: 8px;
            background-color: var(--custom-white);
            border: 1px solid var(--default-border);
            transition: all 0.3s ease;
          }

          .award-badge:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          }

          .award-icon i {
            color: white;
          }
        `}</style>
      </li>

    </ul>
  );
};

export default Profile;