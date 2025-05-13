import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import TaskCommentsTab from './CommentTask';

export const TaskDetail = () => {
  const [assigneePage, setAssigneePage] = useState(0)
  const assigneesPerPage = 4
  const [activeTab, setActiveTab] = useState("order")
  const [starsAnimated, setStarsAnimated] = useState(false)

  const navigate = useNavigate()
  const { taskId } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setStarsAnimated(false)
  }, [activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === "shipped") {
      setTimeout(() => {
        setStarsAnimated(true)
      }, 100)
    }
  }

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await axios.get(`https://lavoro-back.onrender.com/tasks/task/${taskId}`)
        setTask(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching task")
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  const getStatusBadge = (status) => {
    switch (status) {
      case "Not Started":
        return <span className="badge bg-warning-transparent">Not Started</span>
      case "In Progress":
        return <span className="badge bg-info-transparent">In Progress</span>
      case "Completed":
        return <span className="badge bg-success-transparent">Completed</span>
      default:
        return <span className="badge bg-secondary-transparent">{status}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Low":
        return <span className="badge bg-success-transparent">Low</span>
      case "Medium":
        return <span className="badge bg-warning-transparent">Medium</span>
      case "High":
        return <span className="badge bg-danger-transparent">High</span>
      default:
        return <span className="badge bg-secondary-transparent">{priority}</span>
    }
  }

  const totalAssigneePages = task?.assigned_to ? Math.ceil(task.assigned_to.length / assigneesPerPage) : 0

  const handlePrevPage = () => {
    setAssigneePage((prev) => Math.max(prev - 1, 0))
  }

  const handleNextPage = () => {
    setAssigneePage((prev) => Math.min(prev + 1, totalAssigneePages - 1))
  }

  const paginatedAssignees = task?.assigned_to
    ? task.assigned_to.slice(assigneePage * assigneesPerPage, (assigneePage + 1) * assigneesPerPage)
    : []

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!task) return <div>Task not found</div>

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Tasks</a>
              </li>
              <span className="mx-1">→</span>

              <li className="breadcrumb-item">
                <a href="/listTask">Task List</a>
              </li>
              <span className="mx-1">→</span>

              <li className="breadcrumb-item active" aria-current="page">
                Task Details
              </li>
            </ol>
          </nav>
          
          <h1 className="page-title fw-medium fs-18 mb-0">Task Details</h1>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-9">
          <div className="card custom-card">
            <div className="card-body product-checkout">
              <ul
                className="nav nav-tabs tab-style-8 scaleX d-sm-flex d-block justify-content-around border border-dashed border-bottom-0 bg-light rounded-top"
                id="myTab1"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3 active"
                    id="order-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#order-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="order-tab"
                    aria-selected="true"
                  >
                    <i className="ri-list-check-3 me-2 align-middle" />
                    Details
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3"
                    id="confirmed-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#confirm-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="confirmed-tab"
                    aria-selected="false"
                  >
                    <i className="ri-user-3-line me-2 align-middle" />
                    Assignees
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3"
                    id="shipped-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#shipped-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="shipped-tab"
                    aria-selected="false"
                    onClick={() => handleTabChange("shipped")}
                  >
                    <i className="ri-star-line me-2 align-middle" />
                    Rate
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3"
                    id="comments-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#comments-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="comments-tab"
                    aria-selected="false"
                  >
                    <i className="ri-chat-3-line me-2 align-middle" />
                    Comments
                  </button>
                </li>
                
              </ul>
              <div className="tab-content border border-dashed" id="myTabContent">
                <div
                  className="tab-pane fade show active border-0 p-0"
                  id="order-tab-pane"
                  role="tabpanel"
                  aria-labelledby="order-tab-pane"
                  tabIndex={0}
                >
                  <div className="p-3">
                    <div className="tab-content" id="profile-tabs">
                      <div
                        className="tab-pane show active p-0 border-0"
                        id="profile-about-tab-pane"
                        role="tabpanel"
                        aria-labelledby="profile-about-tab"
                        tabIndex={0}
                      >
                        <ul className="list-group list-group-flush border rounded-3">
                          <li className="list-group-item p-3">
                            <span className="fw-medium fs-15 d-block mb-3">
                              <span className="me-1">✨</span>
                              {task.title} : {getStatusBadge(task.status)}
                            </span>
                            <p className="text-muted mb-2">{task.description || "No description provided"}</p>
                          </li>
                          <li className="list-group-item p-3">
                            <div className="text-muted">
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary p-1 bg-primary-transparent me-2">
                                  <i className="ri-calendar-schedule-line"></i>
                                </span>
                                <span className="fw-medium text-default">Start Date : </span>{" "}
                                {task.start_date ? new Date(task.start_date).toLocaleDateString() : "Not set"}
                              </p>
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary1 p-1 bg-primary1-transparent me-2">
                                  <i className="ri-calendar-schedule-line"></i>
                                </span>
                                <span className="fw-medium text-default">End Date : </span>{" "}
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set"}
                              </p>
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary2 p-1 bg-primary2-transparent me-2">
                                  <i className="ri-time-line"></i>
                                </span>
                                <span className="fw-medium text-default">Estimated Duration : </span>{" "}
                                {task.estimated_duration ? `${task.estimated_duration} days` : "Not estimated"}
                              </p>
                              <p className="mb-0">
                                <span className="avatar avatar-sm avatar-rounded text-primary3 p-1 bg-primary3-transparent me-2">
                                  <i className="ri-gemini-fill"></i>
                                </span>
                                <span className="fw-medium text-default">Priority : </span>{" "}
                                {getPriorityBadge(task.priority)}
                              </p>
                            </div>
                          </li>
                          {task.tags && task.tags.length > 0 && (
                            <li className="list-group-item p-3">
                              <span className="fw-medium fs-15 d-block mb-3">Tags :</span>
                              <div className="w-75">
                                {task.tags.map((tag, index) => (
                                  <span key={index} className="badge bg-light text-muted m-1 border">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="tab-pane fade border-0 p-0"
                  id="confirm-tab-pane"
                  role="tabpanel"
                  aria-labelledby="confirm-tab-pane"
                  tabIndex={0}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3 p-3 border-bottom">
                    <div className="mb-0"></div>
                    <button 
                      className="btn btn-primary1 btn-sm" 
                      onClick={() => navigate(`/taskAssignement/${taskId}`)}
                    >
                      <i className="ri-user-add-line me-1"></i> Assign
                    </button>
                  </div>
                  <div className="card custom-card">
                    <div className="card-body pb-0">
                      <div className="swiper testimonialSwiper2">
                        <div className="swiper-wrapper">
                          {paginatedAssignees.length > 0 ? (
                            <div className="swiper-slide">
                              <div className="row">
                                {paginatedAssignees.map((member, index) => (
                                  <div key={index} className="col-md-6 mb-1">
                                    <div
                                      className="card custom-card overflow-hidden"
                                      style={{ backgroundColor: "rgb(90, 103, 216, 0.1)" }}
                                    >
                                      <div className="p-3 text-center align-items-center justify-content-start gap-2 border-bottom border-block-end-dashed bg-secondary-transparent">
                                        {member.user_id?.image ? (
                                          <img
                                            src={
                                              member.user_id?.image &&
                                              (member.user_id?.image.startsWith("http") ||
                                                member.user_id?.image.startsWith("https"))
                                                ? member.user_id?.image
                                                : member.user_id?.image
                                                  ? `https://lavoro-back.onrender.com${member.user_id?.image}`
                                                  : "../assets/images/faces/11.jpg"
                                            }
                                            alt={`${member.user_id?.firstName || ''} ${member.user_id?.lastName || ''}`.trim() || 'User'}
                                            className="mb-1 mx-auto text-center avatar avatar-xl rounded-circle shadow-sm"
                                            onError={(e) => {
                                              e.target.src = "../assets/images/faces/11.jpg"
                                              e.target.alt = "Default avatar"
                                            }}
                                            style={{
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : (
                                          <div className="mb-2 mx-auto text-center avatar avatar-xl rounded-circle shadow-sm bg-primary d-flex align-items-center justify-content-center">
                                            <span className="text-white fs-18">
                                              {member.user_id?.firstName?.charAt(0)}
                                              {member.user_id?.lastName?.charAt(0)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex-grow-1">
                                          <p className="mb-0 fw-semibold h6">
                                            {member.user_id?.firstName} {member.user_id?.lastName}
                                          </p>
                                          <span className="fw-normal text-muted fs-12">
Developer                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <p>No assignees for this task</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {totalAssigneePages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-0 gap-3">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handlePrevPage}
                            disabled={assigneePage === 0}
                            aria-label="Previous assignees page"
                          >
                            &#8592;
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleNextPage}
                            disabled={assigneePage === totalAssigneePages - 1}
                            aria-label="Next assignees page"
                          >
                            &#8594;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="tab-pane fade border-0 p-0"
                  id="shipped-tab-pane"
                  role="tabpanel"
                  aria-labelledby="shipped-tab-pane"
                  tabIndex={0}
                >
                  <div className="col-xxl-6 col-xxl-12">
                    <div className="card custom-card">
                      <div className="card-body">
                        <div className="d-flex flex-wrap align-items-center justify-content-between">
                          <div className="d-flex align-items-center mx-auto" style={{ gap: '0.2rem' }}>
                            {Array.from({ length: 7 }).map((_, i) => {
                              const starValue = i + 1;
                              const isFilled = task.score >= starValue;
                              const isHalfFilled = task.score >= starValue - 0.5 && task.score < starValue;
                              const starColorClass = task.score === -1 ? 'text-danger' : 'text-warning';
                              const emptyStarColorClass = task.score === -1 ? 'text-danger-transparent' : 'text-light';

                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0.3, scale: 0.8 }}
                                  animate={
                                    starsAnimated
                                      ? {
                                          opacity: isFilled ? 1 : isHalfFilled ? 0.7 : 0.3,
                                          scale: 1,
                                        }
                                      : {}
                                  }
                                  transition={{
                                    delay: i * 0.15,
                                    duration: 0.5,
                                    type: "spring",
                                    stiffness: 300,
                                  }}
                                  style={{ fontSize: '1rem' }}
                                >
                                  <div style={{ position: "relative", display: "inline-block" }}>
                                    <i className={`ri-star-fill fs-2 mx-2 ${emptyStarColorClass}`} />
                                    {(isFilled || task.score === -1) && (
                                      <motion.i
                                        className={`ri-star-fill fs-2 mx-2 ${starColorClass}`}
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                        }}
                                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                                        animate={
                                          starsAnimated
                                            ? {
                                                clipPath: "inset(0 0% 0 0)",
                                              }
                                            : {}
                                        }
                                        transition={{
                                          delay: i * 0.15,
                                          duration: 0.6,
                                          ease: "easeOut",
                                        }}
                                      />
                                    )}
                                    {(isHalfFilled || task.score === -1) && (
                                      <motion.div
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          width: "50%",
                                          overflow: "hidden",
                                        }}
                                        initial={{ width: 0 }}
                                        animate={starsAnimated ? { width: "50%" } : {}}
                                        transition={{
                                          delay: i * 0.15,
                                          duration: 0.4,
                                        }}
                                      >
                                        <i className={`ri-star-fill fs-2 mx-2 ${starColorClass}`} />
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                            <motion.span
                              className={`ms-3 fw-semibold fs-6 ${task.score === -1 ? 'text-danger' : ''}`}
                              initial={{ opacity: 0 }}
                              animate={starsAnimated ? { opacity: 1 } : {}}
                              transition={{ delay: 1.2 }}
                            >
                              ({task.score?.toFixed(1) || 0}/7)
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <br />
                  <div className="mt-1 ">
                    <h6 className="mb-3 ms-5 mx-auto">✨ How the score is calculated:</h6>
                    <div className="row g-1">
                      <div className="col-md-5 ms-5">
                        <div className="p-2 border rounded ">
                          <p className="fw-semibold mb-1">Starting the Task</p>
                          <ul className="list-unstyled mb-0">
                            <li className="d-flex justify-content-between">
                              <span>Started before start date:</span>
                              <span className="fw-bold text-success">+2</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Started on start date:</span>
                              <span className="fw-bold text-success">+1</span>
                            </li>
                            <li className="d-flex justify-content-between gap-1">
                              <span>Started after start date:</span>
                              <span className="fw-bold text-danger">-1</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-5 ms-5 mb-4">
                        <div className="p-2 border rounded">
                          <p className="fw-semibold mb-1">Completing the Task</p>
                          <ul className="list-unstyled mb-0">
                            <li className="d-flex justify-content-between">
                              <span>Completed 1 day early:</span>
                              <span className="fw-bold text-success">+1.5</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Completed on time:</span>
                              <span className="fw-bold text-success">+1</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Completed late:</span>
                              <span className="fw-bold text-danger">-1</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-5 ms-5">
                        <div className="p-2 border rounded ">
                          <p className="fw-semibold mb-1">Priority Bonus</p>
                          <ul className="list-unstyled mb-0">
                            <li className="d-flex justify-content-between">
                              <span>High priority:</span>
                              <span className="fw-bold text-success">+3</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Medium priority:</span>
                              <span className="fw-bold text-success">+2</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Low priority:</span>
                              <span className="fw-bold text-success">+1</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-5 ms-5">
                        <div className="p-2 border rounded ">
                          <p className="fw-semibold mb-1">Score Range</p>
                          <ul className="list-unstyled mb-0">
                            <li className="d-flex justify-content-between">
                              <span>Minimum possible:</span>
                              <span className="fw-bold">-1</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Maximum possible:</span>
                              <span className="fw-bold">7</span>
                            </li>
                            <li className="d-flex justify-content-between">
                              <span>Your score:</span>
                              <span className="fw-bold text-primary">{task.score?.toFixed(1) || 0}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <br />
                </div>
                <div
                  className="tab-pane fade border-0 p-0"
                  id="comments-tab-pane"
                  role="tabpanel"
                  aria-labelledby="comments-tab-pane"
                  tabIndex={0}
                >
                  <TaskCommentsTab taskId={task._id} projectData={task.project_id} />
                </div>
                
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-3">
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title me-1"> {task.project_id?.name}</div>
            </div>
            <div className="card-body p-0">
              {task.project_id ? (
                <>
                  <ul className="list-group mb-0 border-0 rounded-0">
                    <li className="list-group-item p-3 border-top-0">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {task.project_id.ProjectManager_id?.image ? (
                          <img
                            src={
                              task.project_id.ProjectManager_id.image.startsWith("http") ||
                              task.project_id.ProjectManager_id.image.startsWith("https")
                                ? task.project_id.ProjectManager_id.image
                                : `https://lavoro-back.onrender.com${task.project_id.ProjectManager_id.image}`
                            }
                            alt={`${task.project_id.ProjectManager_id.firstName} ${task.project_id.ProjectManager_id.lastName}`}
                            className="avatar avatar-lg bg-light rounded-circle"
                            onError={(e) => {
                              e.target.src = "../assets/images/faces/11.jpg"
                            }}
                          />
                        ) : (
                          <div className="avatar avatar-lg bg-primary rounded-circle d-flex align-items-center justify-content-center">
                            <span className="text-white fs-18">
                              {task.project_id.ProjectManager_id?.firstName?.charAt(0)}
                              {task.project_id.ProjectManager_id?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-fill">
                          <p className="mb-0 fw-semibold">Project Manager</p>
                          <p className="mb-0 text-muted fs-12">
                            {task.project_id.ProjectManager_id?.firstName} {task.project_id.ProjectManager_id?.lastName}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item p-3 border-top-0">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {task.project_id.manager_id?.image ? (
                          <img
                            src={
                              task.project_id.manager_id.image.startsWith("http") ||
                              task.project_id.manager_id.image.startsWith("https")
                                ? task.project_id.manager_id.image
                                : `https://lavoro-back.onrender.com${task.project_id.manager_id.image}`
                            }
                            alt={`${task.project_id.manager_id.firstName} ${task.project_id.manager_id.lastName}`}
                            className="avatar avatar-lg bg-light rounded-circle"
                            onError={(e) => {
                              e.target.src = "../assets/images/faces/11.jpg"
                            }}
                          />
                        ) : (
                          <div className="avatar avatar-lg bg-primary rounded-circle d-flex align-items-center justify-content-center">
                            <span className="text-white fs-18">
                              {task.project_id.manager_id?.firstName?.charAt(0)}
                              {task.project_id.manager_id?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-fill">
                          <p className="mb-0 fw-semibold">Team Manager</p>
                          <p className="mb-0 text-muted fs-12">
                            {task.project_id.manager_id?.firstName} {task.project_id.manager_id?.lastName}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item p-3 border-bottom border-block-end-dashed">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Status:</span>
                        <span>{getStatusBadge(task.project_id.status)}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Priority:</span>
                        <span>{getPriorityBadge(task.project_id.priority)}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Risk Level:</span>
                        <span className="badge bg-light text-muted border">{task.project_id.risk_level || "N/A"}</span>
                      </div>
                    </li>
                  </ul>
                  <div className="p-3 border-bottom border-block-end-dashed">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted">Start Date:</span>
                      <span className="fw-semibold">
                        {task.project_id.start_date ? new Date(task.project_id.start_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted">End Date:</span>
                      <span className="fw-semibold">
                        {task.project_id.end_date ? new Date(task.project_id.end_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Budget:</span>
                      <span className="fw-semibold">
                        {task.project_id.budget ? `${task.project_id.budget.toLocaleString()} TND` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <span className="fw-semibold">Tasks in Project:</span>
                      <span className="badge bg-primary rounded-pill">
                        {task.project_id.tasks?.length || 0}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 text-center">
                  <p className="text-muted">No project associated with this task</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
