import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './DeveloperCommentsView.css';

const DeveloperCommentsView = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  // Define background colors for comment cards
  const bgColors = [
    'bg-secondary-transparent',
    'bg-primary-transparent',
    'bg-primary1-transparent',
    'bg-primary3-transparent',
    'bg-success-transparent',
    'bg-warning-transparent'
  ];

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);

        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch comments
        const commentsResponse = await axios.get(`https://lavoro-back.onrender.com/tasks/getComments/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setComments(commentsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
        setLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  // Initialize Swiper for comments carousel
  useEffect(() => {
    if (comments && comments.length > 0) {
      // Initialize Swiper with autoplay
      swiperRef.current = new Swiper('.testimonialSwiper2', {
        modules: [Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 20,
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
  }, [comments]);

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="col-xl-12">
      <div className="card custom-card">
        <div className="card-header">
          <div className="card-title">
            Comments from Managers
          </div>
        </div>
        <div className="card-body pb-0">
          {comments.length === 0 ? (
            <div className="text-center py-4">
              <i className="ri-chat-3-line fs-3 text-muted"></i>
              <p className="text-muted mt-2">No comments yet</p>
              <p className="text-muted">Comments can only be added by project managers and team managers</p>
            </div>
          ) : (
            <>
              <div className="alert alert-info mb-3">
                <i className="ri-information-line me-2"></i>
                This is a read-only view of comments from your managers.
              </div>

              <div className="swiper testimonialSwiper2">
                <div className="swiper-wrapper">
                  {comments.map((comment, index) => (
                    <div key={comment._id} className="swiper-slide">
                      <div className="card custom-card overflow-hidden">
                        <div className={`p-3 text-center align-items-center justify-content-start gap-2 border-bottom border-block-end-dashed ${bgColors[index % bgColors.length]}`}>
                          {comment.user_id?.image ? (
                            <img
                              src={
                                comment.user_id.image.startsWith('http') ||
                                comment.user_id.image.startsWith('https')
                                  ? comment.user_id.image
                                  : `https://lavoro-back.onrender.com${comment.user_id.image}`
                              }
                              alt={`${comment.user_id?.firstName || ''} ${comment.user_id?.lastName || ''}`.trim() || 'User'}
                              className="mb-2 mx-auto text-center avatar avatar-xl rounded-circle shadow-sm"
                              onError={(e) => {
                                e.target.src = '../assets/images/faces/11.jpg';
                              }}
                              style={{
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div className="mb-2 mx-auto text-center avatar avatar-xl rounded-circle shadow-sm bg-primary d-flex align-items-center justify-content-center">
                              <span className="text-white fs-18">
                                {comment.user_id?.firstName?.charAt(0)}{comment.user_id?.lastName?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <p className="mb-0 fw-semibold h6">
                              {comment.user_id?.firstName} {comment.user_id?.lastName}
                            </p>
                            <span className="fw-normal text-muted fs-12">
                              {comment.user_id?.role?.RoleName || 'Manager'}
                            </span>
                          </div>
                        </div>
                        <div className="card-body">
                          <span className="review-quote secondary">❝</span>
                          <div className="mb-0">
                            {comment.content}
                            <i className="op-4 fs-11 fw-medium">
                              --- {comment.user_id?.firstName} {comment.user_id?.lastName}
                            </i>
                          </div>
                          <div className="badge bg-primary2 rounded-pill float-end">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="swiper-pagination"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperCommentsView;
