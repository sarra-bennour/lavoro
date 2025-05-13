import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeamCards = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Background and badge color options
  const bgColors = ['primary', 'secondary', 'success', 'orange', 'info', 'warning', 'danger', 'teal'];
  const badgeColors = ['primary', 'primary1', 'primary2', 'primary3', 'secondary', 'success', 'primary', 'primary1'];

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/teams', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setTeams(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch teams');
        console.error('Team fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-3">
        <i className="ri-error-warning-line me-2"></i>
        {error}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-5">
        <h5>No teams found</h5>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/teams/create')}
        >
          <i className="ri-team-line me-2"></i>Create New Team
        </button>
      </div>
    );
  }

  return (
    <div className="row">
      {teams.map((team, index) => {
        const bgColor = bgColors[index % bgColors.length];
        const badgeColor = badgeColors[index % badgeColors.length];
        const manager = team.manager_id || {};
        const project = team.project_id || {};

        return (
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-4" key={team._id}>
            <div 
              className="card custom-card team-member text-center h-100"
              onClick={() => navigate(`/teams/${team._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`team-bg-shape ${bgColor}`}></div>
              <div className="card-body">
                <div className="mb-3 lh-1 d-flex gap-2 justify-content-center">
                  <span className={`avatar avatar-xl avatar-rounded bg-${bgColor}`}>
                    {manager.firstName?.charAt(0)}{manager.lastName?.charAt(0)}
                  </span>
                </div>
                
                {/* Team Manager Name */}
                <h6 className="mb-1 fw-semibold text-dark">
                  {manager.firstName} {manager.lastName}
                </h6>
                <p className={`mb-2 fs-11 badge bg-${badgeColor} fw-medium`}>
                  {manager.role?.RoleName || 'Team Manager'}
                </p>
                
                {/* Team Name in Bold Black Text */}
                <h5 className="mb-3 fw-bold text-black">
                  {team.name}
                </h5>
                
                <p className="text-muted fs-12 mb-4">
                  {team.description || 'Team working on ' + (project.name || 'a project')}
                </p>
                
                <div className="d-flex justify-content-center mb-3">
                  <span className="badge bg-light text-dark me-2">
                    <i className="ri-user-line me-1"></i> {team.members?.length || 0} members
                  </span>
                  <span className={`badge ${team.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                    {team.status}
                  </span>
                </div>
              </div>
              <div className="card-footer bg-transparent border-top-0 pt-0">
                <small className="text-muted d-block">
                  <i className="ri-briefcase-line me-1"></i> {project.name || 'No project'}
                </small>
                <small className="text-muted">
                  <i className="ri-calendar-line me-1"></i> Created: {new Date(team.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamCards;