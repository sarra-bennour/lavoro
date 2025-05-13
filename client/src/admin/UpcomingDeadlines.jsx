
import { useEffect, useState } from "react"
import axios from "axios"
import { Swiper, SwiperSlide } from "swiper/react"
import Swal from 'sweetalert2';
import "swiper/css"
import { Bell, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Clock } from "lucide-react"
//import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
//import 'react-circular-progressbar/dist/styles.css';


const UpcomingDeadlinesCarousel = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState({});


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get("https://lavoro-back.onrender.com/admin/upcomingDl");
        
        if (response.data?.success) {
          const validProjects = response.data.data.filter(project => {
            const isValidDate = !isNaN(new Date(project.end_date).getTime());
            if (!isValidDate) {
              console.warn('Invalid date in project:', project._id, project.end_date);
            }
            return isValidDate;
          });
  
          const projectsWithDates = validProjects.map(project => ({
            ...project,
            end_date: new Date(project.end_date),
            daysLeft: Math.ceil((new Date(project.end_date) - new Date()) / (86400000))
          }));
  
          setProjects(projectsWithDates);
          console.log('Fetched projects:', projectsWithDates);
        }
      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  
  
  const handleSendReminder = async (projectId, projectName, managerName) => {
    const result = await Swal.fire({
      title: 'Send Reminder?',
      html: `Are you sure you want to send a deadline reminder to <b>${managerName}</b> about project <b>${projectName}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send reminder',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const response = await axios.post(
            `https://lavoro-back.onrender.com/admin/remind/${projectId}`
          );
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to send reminder');
          }
          return response.data;
        } catch (error) {
          Swal.showValidationMessage(
            `Request failed: ${error.response?.data?.message || error.message}`
          );
          return false;
        }
      }
    });
  
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Reminder Sent!',
        html: `Successfully sent reminder to <b>${managerName}</b>`,
        icon: 'success',
        timer: 2000
      });
    }
  };
  
  

  const getDaysRemaining = (endDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
  }

  const getPriorityStyles = (risk_level) => {
    const styles = {
      High: { bg: "bg-danger-transparent", iconColor: "text-danger", icon: <AlertTriangle size={14} /> },
      Medium: { bg: "bg-warning-transparent", iconColor: "text-warning", icon: <AlertTriangle size={14} /> },
      Low: { bg: "bg-success-transparent", iconColor: "text-success", icon: <AlertTriangle size={14} /> },
    }
    return styles[risk_level] || { bg: "bg-secondary-transparent", iconColor: "text-secondary" }
  }

  const getStatusStyles = (status) => {
    return status === "Completed" ? "text-success" : "text-warning"
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  

  if (loading) {
    return (
      <div className="col-xl-12">
        <div className="card custom-card">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  


  return (
    <div className="col-xl-12">
      <div className="swiper swiper-basic swiper-initialized swiper-horizontal swiper-backface-hidden">
        <div className="swiper-wrapper">
          {projects.length > 0 ? (
            <Swiper spaceBetween={16} slidesPerView={"auto"} className="px-2">
              {projects.map((project) => {
                const daysLeft = getDaysRemaining(project.end_date)
                //const totalDays = Math.ceil((project.end_date - new Date(project.start_date)) / (1000 * 60 * 60 * 24));
                //const progressPercentage = totalDays > 0 ? ((totalDays - daysLeft) / totalDays) * 100 : 100;

                const priority = getPriorityStyles(project.risk_level)
                const isUrgent = daysLeft <= 7
                const statusClass = getStatusStyles(project.status)
                const daysIndicator = isUrgent ? (
                  <ArrowDown className="text-danger lh-1 align-middle ms-1" size={16} />
                ) : (
                  <ArrowDown className="text-danger lh-1 align-middle ms-1" size={16} />
                )

                return (
                  <SwiperSlide key={project._id} style={{ width: "300px" }}>
                    <div className="card custom-card overflow-hidden">
                      <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <span className={`avatar avatar-rounded ${priority.bg} p-2 avatar-sm` }>
                                {priority.icon} 
                              </span>
                            </div>
                            <span className="text-default fs-14 fw-medium">{project.name}</span>
                          </div>
                          <span className="fs-12 text-muted">{project.status}</span>
                        </div>

                        <div className="d-flex flex-fill align-items-end gap-2 justify-content-between mt-3">
                          <div>
                          <span className="d-block text-muted">Manager:</span>
                            <span className="d-block ms-auto fs-15 fw-semibold">
                              {project.manager || "Unassigned"}
                            </span>
                          </div>
                          <div className="text-end">
                            <span className="d-block text-muted fs-12">Days Left:</span>
                            <div className="d-flex align-items-center justify-content-end">
                              <span className={`d-block fs-15 fw-medium ${isUrgent ? "text-danger" : ""}`}>
                                {daysLeft} 
                              </span>
                              {isUrgent && (
                                <Clock className="ms-1 text-danger" size={16} />
                              )}
                              {!isUrgent && daysLeft <= 14 && (
                                <Clock className="ms-1 text-warning" size={16} />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-center mt-3">
                        {/*<div style={{ width: 25, height: 25 }}>
                              <CircularProgressbar
                                value={progressPercentage}
                                text=""
                                styles={buildStyles({
                                  pathColor: isUrgent ? "#dc3545" : "#0d6efd",
                                  
                                  trailColor: "#e9ecef"
                                })}
                              />
                            </div>*/}

                          <button
                            className="btn btn-sm btn-outline-primary " style={{ width: "50%" }}
                            onClick={() => handleSendReminder(
                              project._id, 
                              project.name, 
                              project.manager || "the manager")}
                          >
                            <Bell size={14} className="me-1" />
                            Remind
                          </button>

                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          ) : (
            <div className="swiper-slide" style={{ width: "100%" }}>
              <div className="card custom-card overflow-hidden">
                <div className="card-body text-center py-4">
                  <CheckCircle className="text-success fs-3" />
                  <p className="mt-2 mb-0">All caught up!</p>
                  <p className="text-muted fs-12">No projects ending in the next 30 days</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpcomingDeadlinesCarousel
