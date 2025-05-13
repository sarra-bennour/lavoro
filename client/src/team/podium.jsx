
import { useEffect, useState, useRef } from "react"
import confetti from "canvas-confetti"
import axios from "axios"
import { useNavigate } from 'react-router-dom';


const WinnersPodium = () => {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [predictMembers, setPredictMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [revealStage, setRevealStage] = useState(0) // Start directly at countdown
  const [counter, setCounter] = useState(0) // Starting from 0 and counting up
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [activeView, setActiveView] = useState("winners") // "winners" or "participants"
  const [selectedMember, setSelectedMember] = useState(null)
  const audioRef = useRef(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement
      const isDark = htmlElement.getAttribute("data-theme-mode") === "dark"
      setIsDarkMode(isDark)
    }

    // Initial check
    checkDarkMode()

    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme-mode"],
    })

    return () => observer.disconnect()
  }, [])

  // Fetch predictions and all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch all users for cycling images
        const usersResponse = await axios.get("https://lavoro-back.onrender.com/predict/all")
        setAllUsers(usersResponse.data || [])

        // Fetch predictions
        const response = await axios.get("https://lavoro-back.onrender.com/predict/predict-all")
        const results = response.data.results || [] // Already sorted by backend
        setPredictions(results)

        // If predictions are loaded and we have at least 3 entries, we can stop the countdown
        if (results.length >= 3 && revealStage === 0) {
          // We'll let the countdown useEffect handle the transition to reveal stage
          console.log("Predictions loaded, preparing to reveal podium")
        }

        // Fetch predict members
        const predictMembersResponse = await axios.get("https://lavoro-back.onrender.com/predict/all")
        setPredictMembers(predictMembersResponse.data.members || [])

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [revealStage])


  // Cycle through user images during countdown
  useEffect(() => {
    if (revealStage === 0 && allUsers.length > 0 && activeView === "winners") {
      const interval = setInterval(() => {
        setCurrentUserIndex((prev) => (prev + 1) % allUsers.length)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [revealStage, allUsers, activeView])

  // Handle counter and reveal sequence
  useEffect(() => {
    if (activeView !== "winners") return

    // Check if predictions data is loaded and has at least 3 entries
    const predictionsLoaded = predictions && predictions.length >= 3 && !loading

    if (revealStage === 0 && !predictionsLoaded) {
      // Continue counting up until predictions are loaded
      const timer = setTimeout(() => {
        setCounter(prevCounter => prevCounter + 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (revealStage === 0 && predictionsLoaded) {
      // Start reveal sequence with 3rd place when predictions are loaded
      const timer = setTimeout(() => {
        setRevealStage(1)
        playDrumrollSound()
      }, 1000)
      return () => clearTimeout(timer)
    } else if (revealStage >= 1 && revealStage < 3) {
      // Continue reveal sequence
      const timer = setTimeout(() => {
        setRevealStage(revealStage + 1)
        if (revealStage === 1) {
          playDrumrollSound()
        } else if (revealStage === 2) {
          playFanfareSound()
          triggerConfetti()
        }
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [revealStage, counter, activeView, predictions, loading])

  // Confetti effect for 1st place
  const triggerConfetti = () => {
    // First burst
    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.6 },
      colors: ["#FF479D", "#FF9D3D", "#44D2FF", "#FFDE59", "#7B2CBF"],
    })

    // Left side burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: ["#FF479D", "#FF9D3D", "#44D2FF", "#FFDE59", "#7B2CBF"],
      })
    }, 200)

    // Right side burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: ["#FF479D", "#FF9D3D", "#44D2FF", "#FFDE59", "#7B2CBF"],
      })
    }, 400)

    // Additional bursts
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#FF479D", "#FF9D3D", "#44D2FF", "#FFDE59", "#7B2CBF"],
      })
    }, 600)
  }

  // Sound effects
  const playDrumrollSound = () => {
    if (audioRef.current) {
      audioRef.current.src = "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3"
      audioRef.current.volume = 0.5
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  const playFanfareSound = () => {
    if (audioRef.current) {
      audioRef.current.src = "/sound.wav";
      audioRef.current.volume = 0.5;
      audioRef.current.play()
        .then(() => {
          // Set timeout to stop after 5 seconds
          setTimeout(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset to start
          }, 5000); // 5000ms = 5s
        })
        .catch((e) => console.log("Audio play failed:", e));
    }
  };

  const handleAwardClick = async (userId) => {
    try {
      console.log("Award button clicked with userId:", userId);

      if (!userId) {
        console.error("User ID is undefined or null");
        alert("Cannot award prize: User ID is missing");
        return;
      }

      // Call the API to award the badge to the user
      const response = await axios.post(`https://lavoro-back.onrender.com/predict/award/${userId}`);

 
    } catch (error) {
      console.error('Error awarding badge:', error);
      console.error('Error details:', error.response?.data);

      // Show error message
      if (error.response?.data?.error === 'User already has this award') {
      } else {
        alert(`Failed to award badge: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Helper function to get image URL
  const getImageUrl = (user) => {
    if (!user || !user.image) return "https://via.placeholder.com/100"

    return user.image.startsWith("http") || user.image.startsWith("https")
      ? user.image
      : `https://lavoro-back.onrender.com${user.image}`
  }

  // Helper function to get predict member image URL
  const getPredictMemberImageUrl = (member) => {
    if (!member || !member.user_image) return "https://via.placeholder.com/100"

    return member.user_image.startsWith("http") || member.user_image.startsWith("https")
      ? member.user_image
      : `https://lavoro-back.onrender.com${member.user_image}`
  }

  // Handle view change
  const handleViewChange = (view) => {
    setActiveView(view)
    if (view === "participants") {
      // Reset selected member when switching to participants view
      setSelectedMember(null)
    }
  }

  // Handle member selection in participants view
  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    console.log("Selected member data:", JSON.stringify(member, null, 2));

  }

  // Filter predict members based on search term
  const filteredPredictMembers = predictMembers.filter(
    (member) =>
      member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // No longer needed, removed unused formatDate function

  // Reset podium
  const handleRestart = () => {
    setRevealStage(0)
    setCounter(0)
    setActiveView("winners")
  }

  return (
    <>
      <br />
      <div className="main-podium-container mb-2 gap-2 d-flex">
        {/* Left sidebar */}
        <div className="podium-navigation border">
          <div className="d-grid align-items-top p-3 border-bottom border-block-end-dashed">
            <button
              className="btn btn-primary d-flex align-items-center justify-content-center"
              onClick={handleRestart}
            >
              <i className="ri-restart-line fs-16 align-middle me-1" />
              Restart Podium
            </button>
          </div>
          <div>
            <ul className="list-unstyled podium-main-nav" id="podium-main-nav">
              <li className="px-0 pt-0">
                <span className="fs-11 text-muted op-7 fw-medium">PODIUM CONTROLS</span>
              </li>
              <li className={activeView === "winners" ? "active podium-type" : "podium-type"}>
                <a href="javascript:void(0);" onClick={() => handleViewChange("winners")}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-medal-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">Winners</span>
                    <span className="badge bg-primary rounded-pill">3</span>
                  </div>
                </a>
              </li>
              <li className={activeView === "participants" ? "active podium-type" : "podium-type"}>
                <a href="javascript:void(0);" onClick={() => handleViewChange("participants")}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-team-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">All Participants</span>
                    <span className="badge bg-info rounded-pill">{predictMembers.length}</span>
                  </div>
                </a>
              </li>


            </ul>
          </div>
        </div>

        {/* Main display area */}
        <div className="podium-display border">
          {/* Header */}
          <div className="p-3 d-flex align-items-center border-bottom border-block-end-dashed flex-wrap gap-2">
            <div className="flex-fill">
              <h5 className="fw-semibold mb-0">{activeView === "winners" ? "Winners Podium" : "All Participants"}</h5>
              <p className="text-muted mb-0 fs-12">
                {activeView === "winners"
                  ? "Celebrating our top performers"
                  : `Showing ${filteredPredictMembers.length} team members`}
              </p>
            </div>

            {/* Search bar for participants view */}
            {activeView === "participants" && (
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <input
                  type="text"
                  className="form-control shadow-none"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary" type="button">
                  <i className="ri-search-line"></i>
                </button>
              </div>
            )}
          </div>

          {/* Content area */}
          {activeView === "winners" ? (
            /* Podium content */
            <div className="podium-content">
              <div className="kahoot-container">
                <audio ref={audioRef} />

                {/* Light rays background */}
                <div className="light-rays"></div>

                {/* Counter at the top */}
                {revealStage === 0 && (
                  <div className="countdown-title">
                    <div className="countdown-number">{counter}</div>
                  </div>
                )}

                {/* Spotlight effects */}
                {revealStage >= 1 && (
                  <div className={`spotlight spotlight-3 ${revealStage >= 1 ? "active" : ""}`}></div>
                )}
                {revealStage >= 2 && (
                  <div className={`spotlight spotlight-2 ${revealStage >= 2 ? "active" : ""}`}></div>
                )}
                {revealStage >= 3 && (
                  <div className={`spotlight spotlight-1 ${revealStage >= 3 ? "active" : ""}`}></div>
                )}

                {/* Winners reveal */}
                {revealStage > 0 && (
                  <div className="winners-reveal">
                    <h1 className="winners-title">Top Performers</h1>

                    <div className="podium-wrapper">
                      {/* 2nd Place */}
                      <div className={`podium-place second-place ${revealStage >= 2 ? "revealed" : "hidden"}`}>
                        {predictions[1] && (
                          <>
                            <div className="winner-image-container">
                              <div className="winner-glow silver-glow"></div>
                              <img
                                src={getImageUrl(predictions[1].user) || "/placeholder.svg"}
                                alt={predictions[1].user.name}
                                className="winner-image"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/100"
                                }}
                              />
                              <div className="position-badge silver">2</div>
                            </div>
                            <div className="podium-block silver-podium">
                              <div className="winner-name">{predictions[1].user.name}</div>
                              <div className="winner-score">{predictions[1].predicted_score.toFixed(1)}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 1st Place */}
                      <div className={`podium-place first-place ${revealStage >= 3 ? "revealed" : "hidden"}`}>
                        {predictions[0] && (
                          <>
                            <div className="winner-image-container">
                              <div className="winner-glow gold-glow"></div>
                              <img
                                src={getImageUrl(predictions[0].user) || "/placeholder.svg"}
                                alt={predictions[0].user.name}
                                className="winner-image"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/100"
                                }}
                              />
                              <div className="position-badge gold">1</div>
                            </div>
                            <div className="podium-block gold-podium">
                              <div className="winner-name">{predictions[0].user.name}</div>
                              <div className="winner-score">{predictions[0].predicted_score.toFixed(1)}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 3rd Place */}
                      <div className={`podium-place third-place ${revealStage >= 1 ? "revealed" : "hidden"}`}>
                        {predictions[2] && (
                          <>
                            <div className="winner-image-container">
                              <div className="winner-glow bronze-glow"></div>
                              <img
                                src={getImageUrl(predictions[2].user) || "/placeholder.svg"}
                                alt={predictions[2].user.name}
                                className="winner-image"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/100"
                                }}
                              />
                              <div className="position-badge bronze">3</div>
                            </div>
                            <div className="podium-block bronze-podium">
                              <div className="winner-name">{predictions[2].user.name}</div>
                              <div className="winner-score">{predictions[2].predicted_score.toFixed(1)}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Flash effect for reveals */}
                {revealStage > 0 && <div className={`flash-overlay flash-${revealStage}`}></div>}
              </div>
            </div>
          ) : (
            /* Participants list view */
            <div className="participants-content">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading participants data...</p>
                </div>
              ) : (
                <div className="participants-grid">
                  {filteredPredictMembers.length > 0 ? (
                    filteredPredictMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`participant-card ${selectedMember?._id === member._id ? "selected" : ""}`}
                        onClick={() => handleMemberSelect(member)}
                      >
                        <div className="participant-avatar">
                          <img
                            src={getPredictMemberImageUrl(member) || "/placeholder.svg"}
                            alt={member.user_name}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/100"
                            }}
                          />
                          {member.rank <= 3 && <div className={`rank-badge rank-${member.rank}`}>{member.rank}</div>}
                        </div>
                        <div className="participant-info">
                          <h5 className="participant-name">{member.user_name}</h5>
                          <div className="participant-role">Developer</div>
                          <div className="participant-metrics">
                            <div className="metric">
                              <span className="metric-label">Performance:</span>
                              <span className="metric-value">{member.performance_score.toFixed(1)}</span>
                            </div>

                            <div className="metric">
                              <span className="metric-label">Rank:</span>
                              <span className="metric-value">{member.rank}</span>
                            </div>
                          </div>
                        </div>
                        <div className="participant-actions">
                          <button className="btn btn-sm btn-icon btn-primary" title="View Details">
                            <i className="ri-eye-line"></i>
                          </button>

                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5 w-100">
                      <div className="mb-3">
                        <i className="ri-search-line" style={{ fontSize: "48px", opacity: "0.5" }}></i>
                      </div>
                      <h6 className="text-muted">No participants found</h6>
                      <p className="text-muted small">Try adjusting your search criteria</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar - Details panel */}
        <div className="winner-details border">
          <div className="p-3 border-bottom border-block-end-dashed">
            <h6 className="fw-semibold mb-0">{activeView === "winners" ? "Winner Details" : "Participant Details"}</h6>

            <br />
          </div>
          <div className="p-3">
            <br />
            {activeView === "winners" && revealStage === 3 && predictions[0] ? (
              <div className="winner-profile">
                <div className="text-center mb-4">
                  <div className="avatar avatar-xl mx-auto mb-3">
                    <img
                      src={getImageUrl(predictions[0].user) || "/placeholder.svg"}
                      alt={predictions[0].user.name}
                      className="rounded-circle"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  </div>
                  <h5 className="mb-1">{predictions[0].user.name}</h5>
                  <p className="text-muted mb-2">First Place Winner</p>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    <span className="badge bg-success">Top 1</span>
                  </div>
                </div>

                <div className="winner-stats">
    <h6 className="mb-3">Performance Stats</h6>

    {/* Experience Level */}
    <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
            <span>Experience Level</span>
            <span>
                {predictions[0].experience_level === 1 ? "Junior" :
                 predictions[0].experience_level === 2 ? "Mid" : "Senior"}
            </span>
        </div>
        <div className="progress" style={{ height: "6px" }}>
            <div
                className="progress-bar bg-warning"
                style={{ width: `${predictions[0].experience_level * 33.33}%` }}
            ></div>
        </div>
    </div>

    {/* Tasks Completed */}
    <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
            <span>Tasks Completed</span>
            <span>{predictions[0].total_tasks_completed}</span>
        </div>
        <div className="progress" style={{ height: "6px" }}>
            <div
                className="progress-bar bg-primary"
                style={{ width: `${Math.min(predictions[0].total_tasks_completed, 100)}%` }}
            ></div>
        </div>
    </div>

    {/* Performance Score */}
    <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
            <span>Performance Score</span>
            <span>{predictions[0].predicted_score.toFixed(1)}%</span>
        </div>
        <div className="progress" style={{ height: "6px" }}>
            <div
                className="progress-bar bg-success"
                style={{ width: `${predictions[0].predicted_score.toFixed(1)}%` }}
            ></div>
        </div>
    </div>
</div>
                <div className="mt-4">
                {predictions[0] && (
      <button
        className="btn btn-primary w-100 mb-2"
        onClick={() => {
          console.log("Full prediction data:", predictions[0]);
          handleAwardClick(predictions[0].user._id);
        }}
      >
        <i className="ri-trophy-line me-1"></i> Award Prize
      </button>
    )}
                  
                </div>
              </div>
            ) : activeView === "participants" && selectedMember ? (
              <div className="participant-profile">
                <div className="text-center mb-4">
                  <div className="avatar avatar-xl mx-auto mb-3">
                    <img
                      src={getPredictMemberImageUrl(selectedMember) || "/placeholder.svg"}
                      alt={selectedMember.user_name}
                      className="rounded-circle"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  </div>
                  <h5 className="mb-1">{selectedMember.user_name}</h5>
                  <p className="text-muted mb-2">Developer</p>

                  {/* Badges */}
                  <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                    {selectedMember.rank === 1 && <span className="badge bg-warning">1st Place</span>}
                    {selectedMember.rank === 2 && <span className="badge bg-secondary">2nd Place</span>}
                    {selectedMember.rank === 3 && <span className="badge bg-danger">3rd Place</span>}
                    <span className="badge bg-info">Rank: {selectedMember.rank}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-4">
                  <h6 className="mb-3">Performance Metrics</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Performance Score</span>
                      <span>{selectedMember.performance_score.toFixed(1)}</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className="progress-bar bg-primary"
                        style={{ width: `${selectedMember.performance_score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Experience Level */}
    <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
            <span>Experience Level</span>
            <span>
                {selectedMember.experience_level === 1 ? "Junior" :
                 selectedMember.experience_level === 2 ? "Mid" : "Senior"}
            </span>
        </div>
        <div className="progress" style={{ height: "6px" }}>
            <div
                className="progress-bar bg-warning"
                style={{ width: `${selectedMember.experience_level * 33.33}%` }}
            ></div>
        </div>
    </div>

    {/* Tasks Completed */}
    <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
            <span>Tasks Completed</span>
            <span>{selectedMember.total_tasks_completed}</span>
        </div>
        <div className="progress" style={{ height: "6px" }}>
            <div
                className="progress-bar bg-primary"
                style={{ width: `${Math.min(selectedMember.total_tasks_completed, 100)}%` }}
            ></div>
        </div>
    </div>

                </div>

                {/* Additional Information */}
                <div className="mb-4">
                  <h6 className="mb-3">Additional Information</h6>
                  <ul className="list-group list-group-flush">
                  <li className="list-group-item px-0 d-flex justify-content-between">
  <span className="text-muted">Team:</span>
  <span>{selectedMember.team_name || 'No team assigned'}</span>
</li>

                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="text-muted">Project:</span>
                      <span>{selectedMember.project_name}</span>
                    </li>

                  </ul>
                </div>

                {/* Actions */}

              </div>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="ri-user-line" style={{ fontSize: "48px", opacity: "0.5" }}></i>
                </div>
                <h6 className="text-muted">
                  {activeView === "winners" ? "Waiting for winner reveal" : "Select a participant to view details"}
                </h6>
                <p className="text-muted small">
                  {activeView === "winners"
                    ? "Winner details will appear here after the podium reveal is complete."
                    : "Click on any participant in the list to view their detailed information."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-podium-container {
          display: flex;
          width: 100%;
          min-height: 600px;
          font-family: 'Poppins', sans-serif;
        }

        .podium-navigation {
          width: 250px;
          background-color: var(--custom-white);
          border-color: var(--default-border) !important;
        }

        .podium-display {
          flex: 1;
          background-color: var(--custom-white);
          border-color: var(--default-border) !important;
          overflow: hidden;
        }

        .winner-details {
          width: 300px;
          background-color: var(--custom-white);
          border-color: var(--default-border) !important;
        }

        .podium-content {
          height: calc(100% - 70px);
          overflow: hidden;
        }

        .participants-content {
          height: calc(100% - 70px);
          overflow: auto;
          padding: 0;
        }

        .participants-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .participant-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: var(--custom-white);
          border: 1px solid var(--default-border);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .participant-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
          border-color: var(--primary-color);
        }

        .participant-card.selected {
          border-color: var(--primary-color);
          background-color: var(--primary01);
        }

        .participant-avatar {
          position: relative;
          margin-right: 1rem;
        }

        .participant-avatar img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .rank-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }

        .rank-1 {
          background: linear-gradient(45deg, #FFD700, #FFC107);
        }

        .rank-2 {
          background: linear-gradient(45deg, #C0C0C0, #E0E0E0);
        }

        .rank-3 {
          background: linear-gradient(45deg, #CD7F32, #D2691E);
        }

        .participant-info {
          flex: 1;
        }

        .participant-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .participant-role {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .participant-metrics {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .metric {
          font-size: 0.85rem;
        }

        .metric-label {
          color: var(--text-muted);
          margin-right: 0.25rem;
        }

        .metric-value {
          font-weight: 600;
        }

        .participant-actions {
          display: flex;
          gap: 0.5rem;
        }

        .podium-main-nav {
          padding: 1rem;
        }

        .podium-main-nav li {
          margin-bottom: 0.5rem;
        }

        .podium-main-nav li a {
          display: block;
          padding: 0.75rem 1rem;
          color: var(--menu-prime-color);
          border-radius: 0.375rem;
          text-decoration: none;
        }

        .podium-main-nav li.active a {
          background-color: var(--primary01);
          color: var(--primary-color);
        }

        .podium-main-nav li a:hover {
          background-color: var(--list-hover-focus-bg);
        }

        .kahoot-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          color: #F9FAFC;
          overflow: hidden;
          position: relative;
          background: ${
            revealStage === 0
              ? "linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-rgb) 100%)"
              : revealStage === 1
                ? "linear-gradient(135deg, var(--orange-rgb) 0%, var(--primary-tint3-color) 100%)"
                : revealStage === 2
                  ? "linear-gradient(135deg, var(--info-rgb) 0%, var(--teal-rgb) 100%)"
                  : "linear-gradient(135deg, var(--primary-tint2-color) 0%, var(--pink-rgb) 100%)"
          };
          transition: background 1s ease-in-out;
        }

        /* Countdown at the top */
        .countdown-title {
          position: absolute;
          top: 40px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 100;
        }

        .countdown-number {
          font-size: 120px;
          font-weight: 600;
          color: gray;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          animation: pulse 1s infinite alternate;
        }

        .loading-text {
          font-size: 24px;
          font-weight: 600;
          color: white;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          margin-top: -20px;
          opacity: 0.8;
        }

        /* Light rays background */
        .light-rays {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${
            revealStage === 3
              ? `radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%)`
              : "none"
          };
          opacity: ${revealStage === 3 ? "1" : "0"};
          transition: opacity 1s ease;
          pointer-events: none;
        }

        /* Spotlight effects */
        .spotlight {
          position: absolute;
          width: 200px;
          height: 500px;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          transform: translateY(100%);
          opacity: 0;
          transition: all 1s ease;
          pointer-events: none;
        }

        .spotlight.active {
          opacity: 0.7;
          transform: translateY(0);
        }

        .spotlight-1 {
          left: 50%;
          margin-left: -100px;
        }

        .spotlight-2 {
          left: 30%;
          margin-left: -100px;
        }

        .spotlight-3 {
          left: 70%;
          margin-left: -100px;
        }

        /* Flash effect for reveals */
        .flash-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: white;
          opacity: 0;
          pointer-events: none;
        }

        .flash-1 {
          animation: flash 0.5s ease-out;
        }

        .flash-2 {
          animation: flash 0.5s ease-out;
        }

        .flash-3 {
          animation: flash 0.5s ease-out;
        }

        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        /* Winners Reveal */
        .winners-reveal {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
        }

        .winners-title {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: -70px;
          color: gray;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          animation: title-glow 2s infinite alternate;
        }

        @keyframes title-glow {
          0% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          100% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5);
          }
        }

        .podium-wrapper {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          max-width: 800px;
          height: 500px;
          position: relative;
        }

        .podium-place {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          position: relative;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .podium-place.hidden {
          opacity: 0;
          transform: translateY(100px);
        }

        .podium-place.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .winner-image-container {
          position: relative;
          margin-bottom: 15px;
          z-index: 10;
        }

        .winner-glow {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          top: -10px;
          left: -10px;
          z-index: -1;
          animation: glow-pulse 2s infinite alternate;
        }

        .gold-glow {
          background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0) 70%);
        }

        .silver-glow {
          background: radial-gradient(circle, rgba(192, 192, 192, 0.6) 0%, rgba(192, 192, 192, 0) 70%);
        }

        .bronze-glow {
          background: radial-gradient(circle, rgba(205, 127, 50, 0.6) 0%, rgba(205, 127, 50, 0) 70%);
        }

        @keyframes glow-pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        .winner-image {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid white;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .position-badge {
          position: absolute;
          bottom: -10px;
          right: -10px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          border: 3px solid white;
        }

        .gold {
          background: linear-gradient(45deg, #FFD700, #FFC107);
        }

        .silver {
          background: linear-gradient(45deg, #C0C0C0, #E0E0E0);
        }

        .bronze {
          background: linear-gradient(45deg, #CD7F32, #D2691E);
        }

        .podium-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 180px;
          padding: 15px 10px;
          color: white;
          font-weight: bold;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
          animation: grow-up 1s forwards;
          transform-origin: bottom;
          position: relative;
          overflow: hidden;
        }

        .podium-block::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% {
            top: -50%;
            left: -50%;
          }
          100% {
            top: 150%;
            left: 150%;
          }
        }

        @keyframes grow-up {
          0% {
            transform: scaleY(0);
          }
          100% {
            transform: scaleY(1);
          }
        }

        .gold-podium {
          height: 220px;
          background: linear-gradient(to bottom, #FF479D, #FF1A75);
        }

        .silver-podium {
          height: 170px;
          background: linear-gradient(to bottom, #44D2FF, #00A3FF);
        }

        .bronze-podium {
          height: 120px;
          background: linear-gradient(to bottom, #FF9D3D, #FF8000);
        }

        .first-place {
          z-index: 3;
        }

        .second-place {
          margin-right: -20px;
          z-index: 2;
        }

        .third-place {
          margin-left: -20px;
          z-index: 1;
        }

        .winner-name {
          font-size: 18px;
          text-align: center;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .winner-score {
          font-size: 28px;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .main-podium-container {
            flex-direction: column;
          }

          .podium-navigation, .winner-details {
            width: 100%;
            margin-bottom: 1rem;
          }

          .podium-main-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .podium-main-nav li {
            margin-bottom: 0;
          }
        }

        @media (max-width: 768px) {
          .podium-wrapper, .podium-container {
            max-width: 100%;
            height: 400px;
          }

          .podium-block {
            width: 140px;
          }

          .winner-image, .cycling-image {
            width: 90px;
            height: 90px;
          }

          .second-place, .third-place, .second-place-preview, .third-place-preview {
            margin-right: -10px;
            margin-left: -10px;
          }

          .winners-title {
            font-size: 30px;
          }

          .countdown-number {
            font-size: 80px;
          }

          .participant-card {
            flex-direction: column;
            text-align: center;
          }

          .participant-avatar {
            margin-right: 0;
            margin-bottom: 1rem;
          }

          .participant-metrics {
            justify-content: center;
          }

          .participant-actions {
            margin-top: 1rem;
          }
        }

        @media (max-width: 480px) {
          .podium-block {
            width: 100px;
          }

          .winner-image, .cycling-image {
            width: 70px;
            height: 70px;
          }

          .winner-name {
            font-size: 14px;
          }

          .winner-score {
            font-size: 20px;
          }

          .countdown-number {
            font-size: 60px;
          }
        }
      `}</style>
    </>
  )
}

export default WinnersPodium
