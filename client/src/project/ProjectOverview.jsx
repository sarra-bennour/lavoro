import React, { useState, useEffect } from 'react';
import { useParams, useNavigate ,useLocation  } from 'react-router-dom'; // Import useNavigate
import Swal from 'sweetalert2';

export default function ProjectOverview(){
  const { id } = useParams(); // Get the project ID from the URL
  const [project, setProject] = useState(null); // State for project details
  const [history, setHistory] = useState([]); // State for project history
  const [loading, setLoading] = useState(true); // State for loading status
  const [manager, setManager] = useState(null); // State for manager details
  const [projectManager, setProjectManager] = useState(null); // State for manager details

  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [itemsPerPage] = useState(7); // Number of items per page
  const [showAddTeamButton, setShowAddTeamButton] = useState(false);
  const navigate = useNavigate(); // Initialize the navigate function
  const { state } = useLocation(); // Get the navigation state

  // Calculate the index of the first and last item on the current page
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);


// Calculate the total number of pages
const totalPages = Math.ceil(history.length / itemsPerPage);

const isTeamManager = state?.isTeamManager || false;




// Handle page change
const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};






const handleStartProject = async (projectId) => {
  try {
    const response = await fetch(`https://lavoro-back.onrender.com/project/${projectId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start project');
    }

    const updatedProject = await response.json();

    // Update local state with the new project data
    setProject(updatedProject);

    // Show success message
    Swal.fire({
      title: "Project Started!",
      text: "The project status has been updated to 'In Progress'",
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });

    // Refresh the history to show the new status change
    await fetchProjectHistory();

  } catch (error) {
    console.error('Error starting project:', error);
    Swal.fire({
      title: "Error",
      text: "An error occurred while starting the project",
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });
  }
};


const handleArchiveClick = async (projectId, projectStatus) => {
  try {
    // Check if the project status is "In Progress"
    if (projectStatus === "In Progress") {
      Swal.fire({
        title: "Cannot Archive Project",
        text: "The project is still in progress and cannot be archived.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return; // Exit the function
    }

    // Proceed with archiving if the status is "Completed" or "Not Started"
    const response = await fetch(`https://lavoro-back.onrender.com/project/${projectId}/archive`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json(); // Parse the error response
      console.error("Error response:", errorData); // Log the error response
      throw new Error("Failed to archive project");
    }

    const data = await response.json();
    console.log("Project archived:", data); // Log the success response

    // Show success alert
    Swal.fire({
      title: "Project Archived",
      text: "The project has been archived successfully.",
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
  }).then((result) => {
    if (result.isConfirmed) {
      // Redirect to the archive page after the user clicks "OK"
      navigate('/listPro'); // Replace '/archive' with your actual archive page route
    }
  });

  } catch (error) {
    console.error("Error archiving project:", error); // Log the error
    Swal.fire({
      title: "Error",
      text: "An error occurred while archiving the project.",
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });
  }
};



const handleDelete = async (projectId) => {
  // Use SweetAlert2 for confirmation
  if (project.status === "In Progress") {
    return Swal.fire({
      title: "Action Not Allowed",
      text: "Projects that are in progress cannot be deleted.",
      icon: "warning",
    });
  }
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      // Call the backend API to delete the project
      const response = await fetch(`https://lavoro-back.onrender.com/project//deleteProject/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "The project has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            // Redirect to the projects list page after the user clicks "OK"
            navigate('/listPro'); // Replace '/listPro' with your actual projects list page route
          }
        });
      } else {
        const errorData = await response.json();
        Swal.fire("Error!", errorData.message || "Failed to delete the project.", "error");
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      Swal.fire("Error!", "An error occurred while deleting the project.", "error");
    }
  }
};

  // Fetch project details
  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/${id}`);

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }

      const data = await response.json();
      if (response.ok) {
        setProject(data); // Set project details
        setShowAddTeamButton(!data.team_id);

        // Manager details are already included in the response
        if (data.manager_id) {
          console.log('Manager Data:', data.manager_id); // Log the manager object
          setManager(data.manager_id); // Set manager details
        }

        if (data.ProjectManager_id) {
          console.log('Project manager Data:', data.ProjectManager_id); // Log the manager object
          setProjectManager(data.ProjectManager_id); // Set manager details
        }
      } else {
        Swal.fire('Error!', data.message || 'Failed to fetch project details.', 'error');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      Swal.fire('Error!', 'An error occurred while fetching project details.', 'error');
    }
  };


  const handleEditClick = (projectId) => {
    navigate(`/updateProjects/${projectId}`);
  };

  const handleAddTeam = () => {
    navigate(`/createTeam`, {
      state: {
        projectId: id,
        projectName: project.name
      }
    });
  };


  // Fetch project history
  const fetchProjectHistory = async () => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/${id}/history`);
      const data = await response.json();
      if (response.ok) {
        setHistory(data); // Set project history
      } else {
        // Swal.fire('Error!', data.message || 'Failed to fetch project history.', 'error');
      }
    } catch (error) {
      console.error('Error fetching project history:', error);
      // Swal.fire('Error!', 'An error occurred while fetching project history.', 'error');
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      await fetchProjectDetails();
      await fetchProjectHistory();
      setLoading(false); // Set loading to false after fetching data
    };

    fetchData();
  }, [id]);

  // Display loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Display error if project is not found
  if (!project) {
    return <div>Project not found.</div>;
  }

  const parseRisks = (risksString) => {
    if (!risksString) return [];
    // Split by number-dot pattern and remove empty strings
    return risksString
      .split(/\s*\d+\.\s*/)
      .filter(risk => risk.trim() !== '');
  };


  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Projects
                </a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item">
                <a href="/listPro">
                  Projects List
                </a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Projects Overview
              </li>
            </ol>
          </nav>
          <br />
          <h1 className="page-title fw-medium fs-18 mb-0">Projects Overview</h1>
        </div>

        <div className="btn-list">
          {/* <button className="btn btn-white btn-wave">
            <i className="ri-filter-3-line align-middle me-1 lh-1" /> Start Project
          </button> */}
                        {!isTeamManager && (

          <button
  className="btn btn-white btn-wave"
  onClick={() => handleStartProject(project._id)}
  disabled={project.status !== 'Not Started'}
>
  <i className="ri-play-line align-middle me-1 lh-1" /> Start Project
</button>
)}
      {isTeamManager && showAddTeamButton && (
                <button
                  className="btn btn-primary btn-wave"
                  onClick={handleAddTeam}
                >
                  <i className="ri-team-line align-middle me-1 lh-1" /> Add Team
                </button>
              )}
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-8">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Project Details</div>
              {!isTeamManager && (
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleEditClick(project._id)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-primary btn-wave"
                    onClick={() => handleDelete(project._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-sm btn-primary1 btn-wave"
                    onClick={() => handleArchiveClick(project._id, project.status)}
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>

            <div className="card-body">
              <div className="d-flex align-items-center mb-4 gap-2 flex-wrap">
                <span className="avatar avatar-lg me-1 bg-primary-gradient">
                  <i className="ri-stack-line fs-24 lh-1" />
                </span>
                <div>
                  <h6 className="fw-medium mb-2 task-title">
                    {project.name}
                  </h6>
                  <span className={`badge ${project.status === 'Completed' ? 'bg-success-transparent' : project.status === 'In Progress' ? 'bg-warning-transparent' : project.status === 'Not Started' ? 'bg-danger-transparent' : 'bg-info-transparent'}`}>
                    {project.status}
                  </span>
                  <span className="text-muted fs-12">
                    <i className="ri-circle-fill text-success mx-2 fs-9" />
                    Last Updated : {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="fs-15 fw-medium mb-2">
                Project Description :
              </div>
              <p className="text-muted mb-4">
                {project.description}
              </p>

              <div className="d-flex gap-5 mb-4 flex-wrap">
              <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                    <i className="ri-user-3-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <span className="d-block fs-14 fw-medium">Project Manager</span>
                    <span className="fs-12 text-muted">
                      {projectManager && projectManager.firstName && projectManager.lastName
                        ? `${projectManager.firstName} ${projectManager.lastName}`
                        : 'projectManager not assigned'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary1-transparent">
                    <i className="ri-calendar-event-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <div className="fw-medium mb-0 task-title">Start Date</div>
                    <span className="fs-12 text-muted">{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                    <i className="ri-time-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <div className="fw-medium mb-0 task-title">End Date</div>
                    <span className="fs-12 text-muted">{new Date(project.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary1-transparent">
                    <i className="ri-money-dollar-circle-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <div className="fw-medium mb-0 task-title">Budget</div>
                    <span className="fs-12 text-muted">{project.budget}</span>
                  </div>
                </div>
               <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                    <i className="ri-user-3-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <span className="d-block fs-14 fw-medium">Team Manager</span>
                    <span className="fs-12 text-muted">
                      {manager && manager.firstName && manager.lastName
                        ? `${manager.firstName} ${manager.lastName}`
                        : 'Manager not assigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
  <div className="row">
    <div className="col-xl-6">
      <div className="fs-15 fw-medium mb-2">Key tasks :</div>
      <ul className="task-details-key-tasks mb-0">
        {project?.tasks?.length > 0 ? (
          project.tasks.map((task) => (
            <li key={task._id} className="d-flex align-items-center">
              <i className="ri-check-line fs-15 text-success me-2" />
              <span className="text-muted">{task.title}</span>
            </li>
          ))
        ) : (
          <div className="text-muted">No tasks yet</div>
        )}
      </ul>

    </div>
                  <div className="col-xl-6">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fs-15 fw-medium">Risks :</div>
                      <a
                        href="javascript:void(0);"
                        className="btn btn-primary-light btn-wave btn-sm waves-effect waves-light"
                      >
                        {project.risk_level}
                      </a>
                    </div>
                    <ul className="list-group">
                      {(() => {
                        try {
                          const risksText = project.risks || '';
                          if (risksText.includes('\n')) {
                            return risksText.split('\n')
                              .filter(line => line.trim().length > 0)
                              .map((risk, index) => (
                                <li key={index} className="list-group-item">
                                  <div className="d-flex align-items-center">
                                    <div className="me-2">
                                      <i className="ri-alert-line fs-15 text-danger" />
                                    </div>
                                    <div>{risk.trim()}</div>
                                  </div>
                                </li>
                              ));
                          }
                          const numberedItems = risksText.split(/\d+\.\s+/).filter(x => x.trim());
                          if (numberedItems.length > 1) {
                            return numberedItems.map((risk, index) => (
                              <li key={index} className="list-group-item">
                                <div className="d-flex align-items-center">
                                  <div className="me-2">
                                    <i className="ri-alert-line fs-15 text-danger" />
                                  </div>
                                  <div>{risk.trim()}</div>
                                </div>
                              </li>
                            ));
                          }
                          return (
                            <li className="list-group-item">
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  <i className="ri-alert-line fs-15 text-danger" />
                                </div>
                                <div>{risksText || 'No risks identified'}</div>
                              </div>
                            </li>
                          );
                        } catch (error) {
                          console.error('Error parsing risks:', error);
                          return (
                            <li className="list-group-item text-muted">
                              Error displaying risks
                            </li>
                          );
                        }
                      })()}
                    </ul>
                  </div>

                </div>
              </div>

              <div className="fs-15 fw-medium mb-2">Tags :</div>
              <div className="d-flex gap-2 flex-wrap">
                {project.tags.split(',').map((tag, index) => (
                  <span key={index} className="badge bg-light text-default border">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-footer">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <div className="d-flex gap-3 align-items-center">
                  <span className="d-block fs-14 fw-medium">AI Estimation:</span>
                </div>
                <div className="d-flex gap-3 align-items-center">
                  <span className="fs-12">Duration:</span>
                  <span className="d-block">
                    <span className="badge bg-primary">
                      {project.estimated_duration ? `${project.estimated_duration} months` : 'Not specified'}
                    </span>
                  </span>
                </div>
                <div className="d-flex gap-3 align-items-center">
                  <span className="fs-12">Team:</span>
                  <span className="d-block fs-14 fw-medium">
                    <span className="badge bg-info">
                      {project.team_member_count || 0} members
                    </span>
                  </span>
                </div>
                <div className="d-flex gap-3 align-items-center">
                  <span className="fs-12">Tasks:</span>
                  <span className="d-block fs-14 fw-medium">
                    <span className="badge bg-success">
                      {project.total_tasks_count || 0} tasks
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
  className="btn btn-primary btn-wave"
  onClick={() => navigate(`/projects/${project._id}/kanban`)}
>
  <i className="ri-kanban-line align-middle me-1 lh-1" /> Kanban Board
</button>

        <div className="col-xxl-4">
          <div className="card custom-card">
            <div className="card-header pb-0">
              <div className="card-title">Project History</div>
            </div>
            <div className="card-body">
              <ul className="list-unstyled profile-timeline">
                {currentHistory.length > 0 ? (
                  currentHistory.map((entry, index) => (
                    <li key={index}>
                      <div>
                        <span className="avatar avatar-sm shadow-sm bg-primary avatar-rounded profile-timeline-avatar">
                          {entry.change_type.charAt(0)}
                        </span>
                        <div className="mb-2 d-flex align-items-start gap-2">
                          <div>
                            <span className="fw-medium">{entry.change_type}</span>
                          </div>
                          <span className="ms-auto bg-light text-muted badge">
                            {new Date(entry.changed_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {entry.change_type === 'Project Created' ? (
                          <p className="text-muted mb-0">
                            <b>{entry.new_value}</b>
                          </p>
                        ) : (
                          <p className="text-muted mb-0">
                            Changed from <b>{entry.old_value}</b> to <b>{entry.new_value}</b>.
                          </p>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className="text-muted">No history available.</div>
                  </li>
                )}
              </ul>
            </div>

            <div className="card-footer">
              <div className="d-flex justify-content-center align-items-center w-100">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-primary-light btn-wave waves-effect waves-light"
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                  <span className="btn-primary-light mx-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-primary-light btn-wave waves-effect waves-light"
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}