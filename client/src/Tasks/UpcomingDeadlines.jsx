import React, { useEffect, useRef } from 'react';
import { RiAlertLine } from 'react-icons/ri';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

// Swiper will handle the layout

const UpcomingDeadlines = ({ tasks }) => {
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  // Define colors for borders
  const COLORS = {
    primary: '#3B82F6',    // Blue
    secondary: '#EC4899',  // Pink
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Orange
    indigo: '#6366F1',     // Indigo
    purple: '#8B5CF6',     // Purple
    danger: '#EF4444',     // Red
    teal: '#14B8A6',       // Teal
    orange: '#F97316',     // Dark orange
    slate: '#64748B'       // Slate
  };

  // Get a random color from the COLORS object
  const getRandomBorderColor = () => {
    const colorKeys = Object.keys(COLORS);
    const randomIndex = Math.floor(Math.random() * colorKeys.length);
    return COLORS[colorKeys[randomIndex]];
  };

  // Initialize Swiper for task cards
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Initialize Swiper with autoplay
      swiperRef.current = new Swiper('#tasks-swiper', {
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
          // When window width is >= 768px
          768: {
            slidesPerView: 3,
            spaceBetween: 20
          },
          // When window width is >= 992px
          992: {
            slidesPerView: 4,
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
  }, [tasks]);

  // Define text colors based on priority
  const getTextColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-danger';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-success';
      case 'Normal': return 'text-primary';
      default: return 'text-primary';
    }
  };

  // Define status badge colors
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Not Started': return 'bg-secondary-transparent';
      case 'In Progress': return 'bg-info-transparent';
      case 'In Review': return 'bg-warning-transparent';
      case 'Done': return 'bg-success-transparent';
      default: return 'bg-primary-transparent';
    }
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days left`;
  };

  return (
    <div className="swiper" id="tasks-swiper">
      <div className="swiper-wrapper">
        {tasks.map((task) => (
          <div key={task._id} className="swiper-slide">
            <div
              className="card h-100"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: getRandomBorderColor()
              }}
            >
              <div className="card-body d-flex flex-column">
                {/* Task Title with Priority Icon */}
                <div className="mb-1">
                  <h5 className="card-title fs-14 fw-semibold mb-0">
                    <a
                      href="#"
                      className="text-dark"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/developer/taskdetails/${task._id}`);
                      }}
                    >
                      {task.title}
                      {task.priority === 'High' && (
                        <RiAlertLine className={`ms-2 ${getTextColor(task.priority)}`} />
                      )}
                    </a>
                  </h5>
                </div>

                {/* Status and Priority Badges */}
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                    {task.status || 'Not Started'}
                  </span>
                  <span className={`badge bg-${getTextColor(task.priority).replace('text-', '')}-transparent`}>
                    {task.priority}
                  </span>
                </div>

                {/* Project Name */}
                {task.project_id && (
                  <div className="mb-2 text-muted small">
                    <i className="bi bi-folder me-1"></i>
                    {task.project_id.name}
                  </div>
                )}

                {/* Spacer to push content to bottom */}
                <div className="flex-grow-1"></div>

                {/* Bottom Section with Assignees and Deadline */}
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <div className="avatar-list-stacked">
                    {task.assigned_to?.slice(0, 2).map((user, index) => (
                      <span key={index} className="avatar avatar-sm avatar-rounded">
                        {user.user_id?.image ? (
                          <img
                            src={user.user_id.image.startsWith('http') ? user.user_id.image : `https://lavoro-back.onrender.com${user.user_id.image}`}
                            alt={`${user.user_id.firstName} ${user.user_id.lastName}`}
                            onError={(e) => {
                              e.target.src = '../assets/images/faces/11.jpg';
                            }}
                          />
                        ) : (
                          <div className="avatar-text bg-primary text-white">
                            {user.user_id?.firstName?.charAt(0)}{user.user_id?.lastName?.charAt(0)}
                          </div>
                        )}
                      </span>
                    ))}
                    {task.assigned_to?.length > 2 && (
                      <span className="avatar avatar-sm avatar-rounded bg-light text-dark">
                        +{task.assigned_to.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="text-danger small fw-semibold">
                    {getDaysUntilDeadline(task.deadline)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="swiper-pagination"></div>
    </div>
  );
};

export default UpcomingDeadlines;