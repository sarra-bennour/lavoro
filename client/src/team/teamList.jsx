import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeamCards = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Default color if team doesn't have one
  const defaultColor = '#3755e6'; // Primary blue

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('https://lavoro-back.onrender.com/teams/getAllTeams', {
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
          onClick={() => navigate('/createTeam')}
        >
          <i className="ri-team-line me-2"></i>Create New Team
        </button>
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
                <li className="breadcrumb-item"><a href="#" onClick={(e) => e.preventDefault()}>Teams</a></li>
                <span className="mx-1">→</span>

                <li className="breadcrumb-item active" aria-current="page">Teams List</li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">Teams List</h1>
          </div>
          <div className="btn-list">
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => navigate('/teams/searchTeam')}
            >
              <i className="ri-search-line me-1"></i> Search Teams
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/createTeam')}
            >
              <i className="ri-team-line me-1"></i> Create New Team
            </button>
          </div>
        </div>
    <div>
      {/* Teams Grid */}
      <div className="row">
        {teams.map((team) => {
        // Use team color from database or default to primary blue
        const teamColor = team.color || defaultColor;
        const manager = team.manager_id || {};
        const project = team.project_id || {};

        return (

          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-4" key={team._id}>
            <div
              className="card custom-card team-member text-center h-100"
              onClick={() => navigate(`/teams/teamDetails/${team._id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Apply team color to the background shape */}
              <div className="team-bg-shape" style={{ backgroundColor: teamColor }}></div>
              <div className="card-body">
                <div className="mb-3 lh-1 d-flex gap-2 justify-content-center">
                  {/* Team image with colored background */}
                  <div
                    style={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: teamColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0',
                      overflow: 'visible'
                    }}
                  >
                    <img
                      src="/assets/images/team.png"
                      alt={team.name}
                      style={{
                        width: '90%',
                        height: '90%',
                        objectFit: 'contain',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  </div>
                </div>

                {/* Team Name in Bold Black Text */}
                <h5 className="mb-2 fw-bold text-black">
                  {team.name}
                </h5>

                {/* Team Manager Name inside the badge with team color */}
                <p className="mb-3 fs-11 badge fw-medium" style={{ backgroundColor: teamColor }}>
                  {manager.firstName} {manager.lastName}
                </p>

                <p className="text-muted fs-12 mb-4">
                  {team.description || 'Team working on ' + (project.name || 'a project')}
                </p>

                <div className="d-flex justify-content-center mb-3">
                  <span className="badge bg-light text-dark me-2">
                    <i className="ri-user-line me-1"></i> {team.members?.length || 0} members
                  </span>
                  <span
                    className={`badge ${team.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}
                  >
                    {team.status || 'Active'}
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
    </div>
    </div>
  );
};

export default TeamCards;