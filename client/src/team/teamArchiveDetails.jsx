import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import Swal from 'sweetalert2';
import TeamHistoryTimeline from './teamHistory';

const TeamArchiveDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const swiperRef = useRef(null);

  // Initialize Swiper for team members
  useEffect(() => {
    if (team && team.members && team.members.length > 0) {
      swiperRef.current = new Swiper('#team-members-swiper', {
        modules: [Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },
        breakpoints: {
          576: {
            slidesPerView: 2,
            spaceBetween: 20
          },
          992: {
            slidesPerView: 3,
            spaceBetween: 30
          }
        }
      });

      return () => {
        if (swiperRef.current && swiperRef.current.destroy) {
          swiperRef.current.destroy();
        }
      };
    }
  }, [team]);

  useEffect(() => {
    const fetchArchivedTeam = async () => {
      try {
        console.log(`Fetching archived team with ID: ${id}`);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          navigate('/signin');
          return;
        }

        const response = await axios.get(`https://lavoro-back.onrender.com/teams/archived-team/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true // Important for session cookies
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
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedTeam();
  }, [id, navigate]);

  const handleRestoreTeam = async () => {
    try {
      const result = await Swal.fire({
        title: 'Restore Team?',
        text: "This team will be moved back to active teams.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, restore it!'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        await axios.post(
          `https://lavoro-back.onrender.com/teams/unarchive/${id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        // If no error was thrown, the request was successful
        await Swal.fire('Restored!', 'Team has been restored successfully.', 'success');
        navigate('/teamsList');
      }
    } catch (err) {
      console.error('Restore error:', err);
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to restore team',
        icon: 'error'
      });
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete the archived team. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }

        await axios.delete(
          `https://lavoro-back.onrender.com/teams/archived-teams/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        await Swal.fire('Deleted!', 'Archived team has been permanently deleted.', 'success');
        navigate('/teams/archived');
      }
    } catch (err) {
      console.error('Delete error:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.message || 'Failed to delete archived team',
        'error'
      );
    }
  };

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

  if (!team) {
    return (
      <div className="text-center py-5">
        <h5>Archived team not found</h5>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate('/teams/archived')}
        >
          <i className="ri-arrow-left-line me-2"></i>Back to Archived Teams
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
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/teams/archived'); }}>
                  Archived Teams
                </a>
              </li>
              <span className="mx-1">→</span>

              <li className="breadcrumb-item active" aria-current="page">
                Team Archive Details
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Archived Team Details</h1>
        </div>
        <div className="btn-list">
          <button className="btn btn-primary btn-wave" onClick={handleRestoreTeam}>
            <i className="ri-refresh-line me-1"></i> Restore Team
          </button>
        </div>
      </div>
      {/* Page Header Close */}

      {/* Start::row-1 */}
      <div className="row">
        <div className="col-xxl-9">
          <div className="card bg-secondary-transparent">
            <div className="card-body">
              <div className="card custom-card overflow-hidden job-info-banner">
                <div
                  className="team-banner"
                  style={{
                    height: '200px',
                    background: `linear-gradient(to right, ${team.color || '#6c757d'}, #ffffff)`,
                    borderRadius: '8px'
                  }}
                ></div>
              </div>
              <div className="card custom-card job-info-data mb-2">
                <div className="card-body">
                  <div className="d-flex flex-wrap align-items-top justify-content-between gap-2">
                    <div>
                      <div className="d-flex flex-wrap gap-2">
                        <div>
                          <span className="avatar avatar-lg border p-1" style={{
                              position: 'relative',
                              width: '60px',
                              height: '60px',
                              backgroundColor: team.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              overflow: 'visible'
                              }}>
                            <img
                              src="/assets/images/team.png"
                              alt={`${team.manager_id?.firstName} ${team.manager_id?.lastName}`}
                              className="rounded-circle"
                            />
                          </span>
                        </div>
                        <div>
                          <h5 className="fw-medium mb-0 d-flex align-items-center">
                            <a href="#" className="" onClick={(e) => e.preventDefault()}>
                              {team.name}
                            </a>
                            <span className="badge bg-secondary ms-2">Archived</span>
                          </h5>
                          <a href="#" className="fs-12 text-muted" onClick={(e) => e.preventDefault()}>
                            <i className="bi bi-building me-1"></i>
                            {team.project_id?.name || 'No project assigned'}
                          </a>
                          <div className="d-flex mt-3">
                            <div>
                              <p className="mb-1">
                                <i className="bi bi-people me-1"></i>
                                {team.members?.length || 0} Members
                              </p>
                              <p>
                                <i className="bi bi-person-check me-1"></i>
                                Manager: {team.manager_id?.firstName} {team.manager_id?.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="popular-tags">
                            <span className="badge rounded-pill bg-secondary-transparent">
                              <i className="bi bi-circle-fill me-1"></i> Archived
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-end ms-auto">
                      <div className="d-flex gap-2 flex-wrap mt-3 justify-content-end">
                        <button
                          className="btn mb-0 btn-icon btn-danger-light btn-wave"
                          onClick={handleDeleteTeam}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Permanently Delete"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Description Card */}
          <div className="card custom-card">
            <div className="card-body">
              <h6 className="fw-medium">Team Description</h6>
              <p className="op-9">
                {team.description || 'No description available for this team.'}
              </p>
              <div className="popular-tags">
                {team.tags?.map((tag, index) => (
                  <span key={index} className="badge rounded-pill bg-secondary-transparent me-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <p className="mb-1">
                  <i className="bi bi-calendar-event me-1"></i>
                  Created: {new Date(team.created_at).toLocaleDateString()}
                </p>
                <p className="mb-1">
                  <i className="bi bi-archive me-1"></i>
                  Archived: {team.archivedAt ? new Date(team.archivedAt).toLocaleDateString() : 'N/A'}
                </p>
                <p>
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Last Updated: {new Date(team.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3">
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">Team Highlights</div>
            </div>
            <div className="card-body">
              <div className="mb-3 fs-14 d-flex align-items-center">
                <span className="avatar avatar-sm border lh-1 avatar-rounded me-2 bg-info-transparent">
                  <i className="ri-briefcase-line"></i>
                </span>
                <span className="text-muted">Project</span>
                <span className="ms-auto fw-medium">
                  {team.project_id?.name || 'None'}
                </span>
              </div>
              <div className="mb-3 d-flex align-items-center">
                <span className="avatar avatar-sm border lh-1 avatar-rounded me-2 bg-danger-transparent">
                  <i className="ri-user-line"></i>
                </span>
                <span className="text-muted">Manager</span>
                <span className="ms-auto fw-medium">
                  {team.manager_id?.firstName} {team.manager_id?.lastName}
                </span>
              </div>
              <div className="mb-3 d-flex align-items-center">
                <span className="avatar avatar-sm border lh-1 avatar-rounded me-2 bg-success-transparent">
                  <i className="ri-group-line"></i>
                </span>
                <span className="text-muted">Members</span>
                <span className="ms-auto fw-medium">
                  {team.members?.length || 0}
                </span>
              </div>
              <div className="mb-0 d-flex align-items-center">
                <span className="avatar avatar-sm border lh-1 avatar-rounded me-2 bg-warning-transparent">
                  <i className="ri-archive-line"></i>
                </span>
                <span className="text-muted">Archived On</span>
                <span className="ms-auto fw-medium">
                  {team.archivedAt ? new Date(team.archivedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card custom-card mt-4">
            <div className="card-header justify-content-between">
              <div className="card-title">
                Team Members
              </div>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => navigate(`/teams/${team._id}/members`)}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              <div className="swiper swiper-members" id="team-members-swiper">
                <div className="swiper-wrapper">
                  {team.members?.sort((a, b) => {
                    if (a._id === team.manager_id?._id) return -1;
                    if (b._id === team.manager_id?._id) return 1;
                    return 0;
                  }).map((member) => (
                    <div className="swiper-slide" key={member._id}>
                      <div className="bg-light align-items-center gap-2 p-3 text-center rounded h-100">
                        <div className="lh-1 mb-3">
                          <span className="avatar avatar-xxl avatar-rounded position-relative">
                            <img
                              src={
                                member.image
                                  ? member.image.startsWith('http')
                                    ? member.image
                                    : `https://lavoro-back.onrender.com${member.image}`
                                  : 'https://via.placeholder.com/50'
                              }
                              alt={`${member.firstName} ${member.lastName}`}
                            />
                            {member._id === team.manager_id?._id && (
                              <span className="badge rounded-pill bg-secondary position-absolute" style={{ bottom: '0', right: '0' }}>
                                <i className="ri-star-fill"></i> Manager
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <a
                            href="javascript:void(0);"
                            className="fw-semibold"
                            onClick={() => navigate(`/members/${member._id}`)}
                          >
                            {member.firstName} {member.lastName}
                          </a>
                          <span className="d-block fs-13 text-muted">
                            {member.role?.RoleName || 'Team Member'}
                          </span>
                          <span
                            className={`badge mt-2 ${member.status === 'Available' ? 'bg-success' : 'bg-danger'}`}
                          >
                            {member.status || 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="swiper-pagination"></div>
              </div>
            </div>
          </div>

          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">Archive Information</div>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Archived By</span>
                  <span className="fw-medium">
                    {team.archivedBy?.firstName || 'Unknown'} {team.archivedBy?.lastName || ''}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Archive Reason</span>
                  <span className="fw-medium">
                    {team.archiveReason || 'Not specified'}
                  </span>
                </div>
              </div>
              <div className="mb-0">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Days Archived</span>
                  <span className="fw-medium">
                    {team.archivedAt ?
                      Math.floor((new Date() - new Date(team.archivedAt)) / (1000 * 60 * 60 * 24)).toFixed(0)
                      : 'N/A'} days
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="card custom-card">
                          <TeamHistoryTimeline />
                      </div>

          <div className="card custom-card">
            <div className="card-body">
              <h6 className="fw-medium mb-3">Archive Actions</h6>
              <button
                className="btn btn-primary btn-wave w-100 mb-2"
                onClick={handleRestoreTeam}
              >
                <i className="ri-refresh-line me-2"></i> Restore Team
              </button>
              <button
                className="btn btn-danger btn-wave w-100"
                onClick={handleDeleteTeam}
              >
                <i className="ri-delete-bin-line me-2"></i> Permanently Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamArchiveDetailsPage;