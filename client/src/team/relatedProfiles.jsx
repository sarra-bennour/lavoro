import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/mousewheel";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RelatedProfiles = ({ teamId , currentMemberId})  => {
      const [loading, setLoading] = useState(true);
      const navigate = useNavigate();
      const [relatedMembers, setRelatedMembers] = useState([]);


  useEffect(() => {
          const timeout = setTimeout(() => {
              setLoading(false);
          }, 5000);
  
          const fetchUserInfo = async () => {
              try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                      throw new Error("No token found");
                  }
  
                  const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
                      headers: {
                          Authorization: `Bearer ${token}`,
                      },
                      withCredentials: true,
                  });
  
                  if (!response.data) {
                      navigate("/signin");
                  }
              } catch (err) {
                  console.error("Error fetching user info:", err);
                  if (err.response?.status === 401) {
                      localStorage.removeItem('token');
                      navigate("/signin");
                  }
              } finally {
                  clearTimeout(timeout);
                  setLoading(false);
              }
          };
  
          fetchUserInfo();
          return () => clearTimeout(timeout);
      }, [navigate]);
  
      useEffect(() => {
          const fetchRelatedMembers  = async () => {
              try {
                  const token = localStorage.getItem('token'); // Récupération du token
                  const response = await axios.get(
                      `https://lavoro-back.onrender.com/teamMember/getAllTeamMembers/${teamId}`, // Correction de la typo ici
                      {
                          headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                          },
                          withCredentials: true
                      }
                  );

                  const filteredMembers = response.data.data.filter(
                    member => member.id !== currentMemberId
                  );

                  setRelatedMembers(filteredMembers);
              } catch (error) {
                  console.error('Error fetching member:', error);
              } finally {
                  setLoading(false);
              }
          };
  
          fetchRelatedMembers();
      }, [teamId,currentMemberId]); 


      if (loading) {
          return <div className="text-center py-4">Loading...</div>;
      }
  
      if (!relatedMembers || relatedMembers.length === 0) {
          return <div className="text-center py-4">Related Member not found</div>;
      }
  return (
    <div className="col-xxl-4">
      <div className="card custom-card" style={{ paddingBottom: "10px" }}>
        <div className="card-header">
          <div className="card-title">Related Profiles</div>
        </div>
        <div className="card-body p-0" style={{ height: "400px" }}>
          <Swiper
            direction="vertical"
            slidesPerView={2}
            spaceBetween={16}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            mousewheel={{
              forceToAxis: true,
              sensitivity: 1,
              releaseOnEdges: true
            }}
            modules={[Autoplay, Mousewheel]}
            className="h-100"
            style={{ padding: "0 8px" }}
          >
            {relatedMembers.map((relatedMember) => (
              <SwiperSlide key={relatedMember.id}>
                <div className="card custom-card shadow-none border mb-3 h-100">
                  <div className="card-body p-3 position-relative">
                    {/* Boutons en haut à droite */}
                   
                    <div className="d-flex mb-3 align-items-center">
                      <div className="me-3">
                        <span className="avatar avatar-lg avatar-rounded">
                        <img 
                          src={
                            relatedMember.image?.startsWith('http') || 
                            relatedMember.image?.startsWith('//')
                              ? relatedMember.image
                              : `https://lavoro-back.onrender.com${relatedMember.image}`
                          }
                          alt={relatedMember.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.src = '';
                            e.target.onerror = null;
                          }}
                          className="user-avatar"
                        />
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-medium mb-1">{relatedMember.name}</h6>
                        <p className="mb-1 text-muted">
                          Developer
                        </p>
                        <div className="d-flex align-items-center fs-12 text-muted">
                          <span>Ratings : </span>
                          <div className="ms-2">
                            {/* {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`ri-star${i < Math.floor(relatedMember.rating) ? "-fill" : i < relatedMember.rating ? "-half-fill" : ""} text-warning`}
                              ></i>
                            ))} */}
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < 4 ? "text-warning" : "text-muted"}>
                                  <i className={i < 4 ? "ri-star-fill" : "ri-star-half-fill"}></i>
                              </span>
                            ))}
                          </div>
                          <span className="ms-1">({relatedMember.performance})</span>
                        </div>
                      </div>
                    </div>

                    <div className="popular-tags mb-3 d-flex gap-2 flex-wrap">
                      {relatedMember.skills?.map((skill, index) => (
                        <span 
                          key={index} // Utilisez l'index comme clé puisque les skills sont des strings
                          className="badge rounded-pill fs-11 border border-primary border-opacity-10 text-primary"
                        >
                          <i className="ri-file-text-line me-1"></i> {skill}
                        </span>
                      ))}
                    </div>

                    <div className="d-flex align-items-center flex-wrap gap-1 mb-3">
                      <div className="flex-grow-1">
                        <p className="mb-1">
                          <span className="text-muted">Performance: </span>
                          <span className="fw-medium"> {relatedMember.performance}</span>
                        </p>
                        <p className="mb-0">
                          <span className="text-muted">Completed Tasks: </span>
                          <span className="fw-medium">{relatedMember.tasksCompleted}</span>
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary rounded px-4"
                        onClick={() => window.location.href = `/member-details/${relatedMember.id}`}
                      >
                        View Profile <i className="ri-arrow-right-line ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default RelatedProfiles;