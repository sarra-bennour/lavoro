import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import "../../public/assets/libs/sweetalert2/sweetalert2.min.css";
import axios from 'axios'; // Don't forget to import axios

export default function ProList() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data) {
          setUserInfo(response.data);
        } else {
          navigate("/signin");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        navigate("/signin");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Check if user is Team Manager
  const isTeamManager = userInfo?.role?.RoleName === 'Team Manager';


  const fetchProjects = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin'); // Redirect if no token
        return;
      }
  
      // 2. Build the request URL
      let url = 'https://lavoro-back.onrender.com/project';
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }
  
      // 3. Make the API request with authorization header
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      // 4. Handle response errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch projects');
      }
  
      // 5. Process the data
      const data = await response.json();
      
      // 6. Filter projects if user is Team Manager (optional client-side fallback)
      const filteredData = isTeamManager 
        ? data.filter(project => project.manager_id?._id === userInfo?._id)
        : data;
  
      setProjects(filteredData);
      setFilteredProjects(filteredData);
      
    } catch (err) {
      console.error('Project fetch error:', err);
      setError(err.message);
      
      Swal.fire({
        title: "Error",
        text: err.message || "Failed to load projects",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, isTeamManager, userInfo?._id]); // Add dependencies
  
  // Load projects on mount and when search term changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        const filtered = projects.filter(project =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProjects(filtered);
      } else {
        setFilteredProjects(projects);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, projects]);




  // Action handlers
  const handleViewClick = (projectId) => {
    navigate(`/overviewPro/${projectId}`, {
      state: { isTeamManager } // Pass the current isTeamManager value
    });
  };
  
  
  const handleEditClick = (projectId) => navigate(`/updateProjects/${projectId}`);

  const handleArchiveClick = async (projectId, projectStatus) => {
    if (projectStatus === "In Progress") {
      Swal.fire({
        title: "Cannot Archive Project",
        text: "The project is still in progress and cannot be archived.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/${projectId}/archive`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to archive project");

      Swal.fire({
        title: "Project Archived",
        text: "The project has been archived successfully.",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      // Update both states
      setProjects(prev => prev.filter(p => p._id !== projectId));
      setFilteredProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (error) {
      console.error("Error archiving project:", error);
      Swal.fire({
        title: "Error",
        text: "An error occurred while archiving the project.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteClick = async (projectId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!"
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`https://lavoro-back.onrender.com/project/deleteProject/${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete project");

        Swal.fire("Deleted!", "Your project has been deleted.", "success");
        setProjects(prev => prev.filter(p => p._id !== projectId));
        setFilteredProjects(prev => prev.filter(p => p._id !== projectId));
      } catch (error) {
        console.error("Error deleting project:", error);
        Swal.fire("Error!", "There was an issue deleting the project.", "error");
      }
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => e.preventDefault()}>Projects</a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Projects List
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Projects List</h1>
        </div>
        <div className="btn-list">
        {!isTeamManager && (

          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => navigate('/createPro')}
          >
            <i className="ri-add-line"></i> Add New Project
          </button>
          )}
        </div>
      </div>
      
      {/* Enhanced search bar */}
      <div className="mb-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => fetchProjects(searchTerm)}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Searching...
              </>
            ) : (
              <>
                <i className="ri-search-line me-1"></i> Search
              </>
            )}
          </button>
        </div>
        {searchTerm && (
          <small className="text-muted">
            Showing {filteredProjects.length} results for "{searchTerm}"
          </small>
        )}
      </div>
  
      {/* Projects table */}
      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card overflow-hidden">
            <div className="card-body p-0">
              {loading && projects.length === 0 ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger m-3">{error}</div>
              ) : (
                <div className="table-responsive">
                  <table className="table text-nowrap">
                    <thead>
                      <tr>
                        <th scope="col">Project Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Budget</th>
                        <th scope="col">Start Date</th>
                        <th scope="col">End Date</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                          <tr key={project._id}>
                            <td>{project.name}</td>
                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {project.description || '-'}
                            </td>
                            <td>{project.budget ? `${project.budget} DT` : '-'}</td>
                            <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</td>
                            <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</td>
                            <td>
                              <span className={`badge ${
                                project.status === 'Completed' ? 'bg-success-transparent' :
                                project.status === 'In Progress' ? 'bg-warning-transparent' :
                                project.status === 'Not Started' ? 'bg-danger-transparent' : 'bg-info-transparent'
                              }`}>
                                {project.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleViewClick(project._id)}
                                >
                                  <i className="ri-eye-line me-1"></i> 
                                </button>
                                
                                {!isTeamManager && (
                                  <>
                                    <button
                                      className="btn btn-warning btn-sm"
                                      onClick={() => handleArchiveClick(project._id, project.status)}
                                      disabled={project.status === "In Progress"}
                                    >
                                      <i className="ri-archive-line me-1"></i> 
                                    </button>
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleEditClick(project._id)}
                                    >
                                      <i className="ri-pencil-line me-1"></i> 
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm" 
                                      onClick={() => handleDeleteClick(project._id)}
                                    >
                                      <i className="ri-delete-bin-6-line me-1"></i> 
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            {searchTerm ? 'No projects found matching your search' : 'No projects available'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {filteredProjects.length > 0 && (
              <div className="card-footer d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing <span className="fw-bold">{filteredProjects.length}</span> projects
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary" disabled>
                    <i className="ri-arrow-left-line"></i> Previous
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" disabled>
                    Next <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}