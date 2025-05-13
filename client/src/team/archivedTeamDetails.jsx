import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ArchivedTeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArchivedTeam = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          navigate('/signin');
          return;
        }
        
        console.log(`Fetching archived team with ID: ${id}`);
        
        const response = await axios.get(`https://lavoro-back.onrender.com/teams/archived-team/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });

        console.log('API Response:', response.data);
        
        if (response.data.success) {
          setTeam(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch archived team');
        }
      } catch (err) {
        console.error('Error fetching archived team:', err);
        setError(err.response?.data?.message || 'Failed to fetch archived team details');
        toast.error('Failed to load archived team details');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedTeam();
  }, [id, navigate]);

  const handleUnarchive = async () => {
    if (!window.confirm('Are you sure you want to unarchive this team?')) {
      return;
    }

    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        navigate('/signin');
        return;
      }
      
      const response = await axios.post(`https://lavoro-back.onrender.com/teams/${id}/unarchive`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Team unarchived successfully');
        navigate('/teams/archived');
      }
    } catch (err) {
      console.error('Error unarchiving team:', err);
      toast.error(err.response?.data?.message || 'Failed to unarchive team');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        navigate('/signin');
        return;
      }
      
      const response = await axios.delete(`https://lavoro-back.onrender.com/teams/archived-teams/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Team permanently deleted');
        navigate('/teams/archived');
      }
    } catch (err) {
      console.error('Error deleting team:', err);
      toast.error(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading archived team details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button 
              className="btn btn-outline-danger" 
              onClick={() => navigate('/teams/archived')}
            >
              Back to Archived Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Team Not Found</h4>
          <p>The archived team you're looking for could not be found.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => navigate('/teams/archived')}
            >
              Back to Archived Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><a href="#" onClick={(e) => { e.preventDefault(); navigate('/teamsList'); }}>Teams</a></li>
              <li className="breadcrumb-item"><a href="#" onClick={(e) => { e.preventDefault(); navigate('/teams/archived'); }}>Archived Teams</a></li>
              <li className="breadcrumb-item active" aria-current="page">{team.name}</li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">
            <span className="badge bg-danger me-2">Archived</span>
            {team.name}
          </h1>
        </div>
        <div className="btn-list">
          <button 
            className="btn btn-outline-primary btn-wave"
            onClick={() => navigate('/teams/archived')}
          >
            <i className="ri-arrow-left-line align-middle me-1 lh-1"></i> Back to Archived Teams
          </button>
        </div>
      </div>
      {/* Page Header Close */}

      <div className="row">
        <div className="col-xxl-8 col-xl-12">
          {/* Team Info Card */}
          <div className="card custom-card">
            <div className="card-header" style={{ backgroundColor: team.color || '#3755e6', color: '#fff' }}>
              <div className="card-title">
                Team Information
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="me-3">
                  <span className="avatar avatar-lg" style={{ backgroundColor: team.color || '#3755e6' }}>
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h5 className="mb-0">{team.name}</h5>
                  <p className="text-muted mb-0">
                    Archived on {new Date(team.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="fw-semibold">Description</h6>
                  <p className="text-muted">
                    {team.description || 'No description available'}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-semibold">Project</h6>
                  <div className="d-flex align-items-center">
                    {team.project_id ? (
                      <>
                        <span className="avatar avatar-sm bg-primary me-2">
                          {team.project_id.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="mb-0 fw-medium">{team.project_id.name}</p>
                          <small className="text-muted">{team.project_id.description?.substring(0, 50)}...</small>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted">No project assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="fw-semibold">Team Manager</h6>
                  <div className="d-flex align-items-center">
                    {team.manager_id ? (
                      <>
                        <span className="avatar avatar-sm me-2">
                          {team.manager_id.image ? (
                            <img src={team.manager_id.image} alt={team.manager_id.firstName} />
                          ) : (
                            <span className="avatar-initial rounded bg-secondary">
                              {team.manager_id.firstName?.charAt(0) || 'U'}
                            </span>
                          )}
                        </span>
                        <div>
                          <p className="mb-0 fw-medium">{team.manager_id.firstName} {team.manager_id.lastName}</p>
                          <small className="text-muted">{team.manager_id.email}</small>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted">No manager assigned</span>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-semibold">Tags</h6>
                  <div>
                    {team.tags && team.tags.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {team.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="badge" 
                            style={{ backgroundColor: team.color || '#3755e6' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">No tags</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-semibold">Created</h6>
                  <p className="text-muted">
                    {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-semibold">Original Status</h6>
                  <span className="badge bg-success">{team.originalStatus || 'Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Card */}
          <div className="card custom-card mt-4">
            <div className="card-header">
              <div className="card-title">Team Members</div>
            </div>
            <div className="card-body">
              {team.members && team.members.length > 0 ? (
                <div className="row">
                  {team.members.map((member, index) => (
                    <div className="col-xl-4 col-md-6 mb-3" key={index}>
                      <div className="card custom-card shadow-none border">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <span className="avatar avatar-md">
                                {member.image ? (
                                  <img src={member.image} alt={member.firstName} />
                                ) : (
                                  <span className="avatar-initial rounded bg-secondary">
                                    {member.firstName?.charAt(0) || 'U'}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <h6 className="mb-0">{member.firstName} {member.lastName}</h6>
                              <p className="text-muted mb-0 fs-12">
                                {member.role?.RoleName || 'Team Member'}
                              </p>
                              {member._id === team.manager_id?._id && (
                                <span className="badge bg-primary mt-1">Manager</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">
                  <i className="ri-information-line me-2"></i>
                  No team members found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-12">
          {/* Actions Card */}
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">Actions</div>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <button 
                  className="btn btn-outline-primary btn-wave"
                  onClick={handleUnarchive}
                  disabled={loading}
                >
                  <i className="ri-refresh-line me-2"></i>
                  Unarchive Team
                </button>
                <button 
                  className="btn btn-outline-danger btn-wave"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <i className="ri-delete-bin-line me-2"></i>
                  Delete Permanently
                </button>
              </div>
              <div className="alert alert-warning mt-4 mb-0">
                <i className="ri-alert-line me-2"></i>
                <strong>Warning:</strong> Permanently deleting a team cannot be undone. All team data will be lost.
              </div>
            </div>
          </div>

          {/* Archive Info Card */}
          <div className="card custom-card mt-4">
            <div className="card-header">
              <div className="card-title">Archive Information</div>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted">Original Status</span>
                  <span className="badge bg-success">{team.originalStatus || 'Active'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted">Created Date</span>
                  <span>{new Date(team.created_at).toLocaleDateString()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted">Archived Date</span>
                  <span>{new Date(team.updated_at).toLocaleDateString()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <span className="text-muted">Team ID</span>
                  <span className="badge bg-light text-dark">{team._id}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivedTeamDetails;
