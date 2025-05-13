import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import Swal from 'sweetalert2';
import TeamHistoryTimeline from './teamHistory';
const TeamDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const swiperRef = useRef(null);
  const [isTeamManager, setIsTeamManager] = useState(false);

useEffect(() => {
  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsTeamManager(response.data?.role?.RoleName === 'Team Manager');
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  fetchUserRole();
}, []);

  // Initialize Swiper for team members
  useEffect(() => {
    if (team && team.members && team.members.length > 0) {
      // Initialize Swiper with autoplay
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
          // When window width is >= 576px
          576: {
            slidesPerView: 2,
            spaceBetween: 20
          },
          // When window width is >= 992px
          992: {
            slidesPerView: 3,
            spaceBetween: 30
          }
        }
      });

      // Cleanup function
      return () => {
        if (swiperRef.current && swiperRef.current.destroy) {
          swiperRef.current.destroy();
        }
      };
    }
  }, [team]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await axios.get(`https://lavoro-back.onrender.com/teams/teamDetails/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setTeam(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch team details');
        console.error('Team fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

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
        <h5>Team not found</h5>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate('/teamsList')}
        >
          <i className="ri-arrow-left-line me-2"></i>Back to Teams
        </button>
      </div>
    );
  }

  const handleDeleteTeam = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
            `https://lavoro-back.onrender.com/teams/deleteTeam/${id}`,
            { withCredentials: true }
          );

        await Swal.fire('Deleted!', 'Team deleted successfully.', 'success');
        navigate('/teamsList');
      }
    } catch (err) {
      console.error('Delete error:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.message || 'Failed to delete team',
        'error'
      );
    }
  };
  const handleArchiveTeam = async () => {
    try {
      // First fetch team details to check project status
      const teamResponse = await axios.get(`https://lavoro-back.onrender.com/teams/teamDetails/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const team = teamResponse.data.data;

      // Check project status
      if (team.project_id?.status === 'In Progress') {
        await Swal.fire({
          title: 'Cannot Archive',
          text: 'This team has a project in progress. Please complete or reassign the project first.',
          icon: 'error'
        });
        return;
      }

      // Proceed with confirmation
      const result = await Swal.fire({
        title: 'Archive Team?',
        text: "This team will be moved to the archive. You can restore it later.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, archive it!'
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          `https://lavoro-back.onrender.com/teams/archive/${id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.status === 200) {
          await Swal.fire('Archived!', 'Team archived successfully.', 'success');
          navigate('/teams/teamArchive');
        }
      }
    } catch (err) {
      console.error('Archive error:', err);
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to archive team',
        icon: 'error'
      });
    }
  };




  return (

      <div className="container-fluid">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
          <div>
            <nav>
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item">
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/teamsList'); }}>
                    Teams
                  </a>
                </li>
                <span className="mx-1">→</span>

                <li className="breadcrumb-item active" aria-current="page">
                  Team Details
                </li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">Team Details</h1>
          </div>

        </div>
        {/* Page Header Close */}

        {/* Start::row-1 */}
        <div className="row">
          <div className="col-xxl-9">
            <div className="card bg-primary-transparent">
              <div className="card-body">
                <div className="card custom-card overflow-hidden job-info-banner">
                  {/* Team Banner Image */}
                  <div
                    className="team-banner"
                    style={{
                      height: '200px',
                      background: `linear-gradient(to right, ${team.color || '#3755e6'}, #ffffff)`,
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
                                src= "/assets/images/team.png"
                                alt={`${team.manager_id?.firstName} ${team.manager_id?.lastName}`}
                                className="rounded-circle"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/50?text=Team";
                                }}
                              />
                            </span>
                          </div>
                          <div>
                            <h5 className="fw-medium mb-0 d-flex align-items-center">
                              <a href="#" className="" onClick={(e) => e.preventDefault()}>
                                {team.name}
                              </a>
                            </h5>
                            <a href="#" className="fs-12 text-muted" onClick={(e) => e.preventDefault()}>
                              <i className="ri-building-line me-1"></i>
                              {team.project_id?.name || 'No project assigned'}
                            </a>
                            <div className="d-flex mt-3">
                              <div>
                                <p className="mb-1">
                                  <i className="ri-team-line me-1"></i>
                                  {team.members?.length || 0} Members
                                </p>
                                <p>
                                  <i className="ri-user-star-line me-1"></i>
                                  Manager: {team.manager_id?.firstName} {team.manager_id?.lastName}
                                </p>
                              </div>

                            </div>
                            <div className="popular-tags">
                  <span className={`badge rounded-pill ${team.status === 'Active' ? 'bg-success-transparent' : 'bg-secondary-transparent'}`}>
                    <i className="ri-checkbox-blank-circle-fill me-1"></i> {team.status}
                  </span>


                </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-end ms-auto">

                        <div className="d-flex gap-2 flex-wrap mt-3 justify-content-end">
                          <button
                            className="btn mb-0 btn-primary"
                            onClick={() => navigate(`/teams/updateTeam/${team._id}`)}
                          >
                            Edit Team
                          </button>
                          <button
                            className="btn mb-0 btn-icon btn-danger-light btn-wave"
                            onClick={handleDeleteTeam}
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete Team"
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
                    <span key={index} className="badge rounded-pill bg-primary-transparent me-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="mb-1">
                    <i className="ri-calendar-event-line me-1"></i>
                    Created: {new Date(team.created_at).toLocaleDateString()}
                  </p>
                  <p>
                  <i className="ri-calendar-event-line me-1"></i>
                  Last Updated: {new Date(team.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Members Card */}

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
                  <span className="avatar avatar-sm border lh-1 avatar-rounded me-2 bg-primary2-transparent">
                    <i className="ri-calendar-line"></i>
                  </span>
                  <span className="text-muted">Created</span>
                  <span className="ms-auto fw-medium">
                    {new Date(team.created_at).toLocaleDateString()}
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
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={() => navigate(`/teams/${team._id}/members`)}
                >
                  View All
                </button>
              </div>
              <div className="card-body">
                {/* Auto-scrolling carousel for team members */}
                <div className="swiper swiper-members" id="team-members-swiper">
                  <div className="swiper-wrapper">
                    {/* Sort members to show manager first */}
                    {team.members?.sort((a, b) => {
                      // Check if member ID matches manager ID to put manager first
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
                                <span className="badge rounded-pill bg-primary position-absolute" style={{ bottom: '0', right: '0' }}>
                                  <i className="ri-star-fill"></i> Manager
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <a
                              href="javascript:void(0);"
                              className="fw-semibold"
                              onClick={() => navigate(`/member-details/${member._id}`)}
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
                <TeamHistoryTimeline />
            </div>
            <div className="card custom-card">
              <div className="card-body">
                <h6 className="fw-medium mb-3">Quick Actions</h6>
                <button
                  className="btn btn-outline-primary btn-wave w-100 mb-2"
                  onClick={() => navigate(`/searchMember/${team._id}`)}
                >
                  <i className="ri-user-add-line me-2"></i> Add Member
                </button>
                <button
                  className="btn btn-outline-secondary btn-wave w-100 mb-2"
                  onClick={() => navigate(`/overviewPro/${team.project_id?._id || ''}`, {
                    state: { isTeamManager: true } // Assuming team managers view from here
                  })}
                >
                  <i className="ri-briefcase-line me-2"></i> View Project
                </button>

                <button
                  className="btn btn-outline-danger btn-wave w-100"
                  onClick={handleArchiveTeam}
                >
                  <i className="ri-archive-line me-2"></i> Archive Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

  );
};

export default TeamDetailsPage;