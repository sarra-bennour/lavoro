import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UpcomingDeadlines from './UpcomingDeadlines';
import Swal from 'sweetalert2';
import TaskTimeline from './TaskTimeline';
import TaskStats from './TaskStats';
import SkillsPolarChart from './SkillsChart';
import DeveloperProjects from './DeveloperProjects';





function DeveloperDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          navigate("/signin");
          return;
        }

        // First get user info with token
        const userResponse = await axios.get('https://lavoro-back.onrender.com/users/me', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        if (!userResponse.data) {
          throw new Error('No user data received');
        }

        setUser(userResponse.data);

        // Then get dashboard data with token
        const dashboardResponse = await axios.get(
          'https://lavoro-back.onrender.com/tasks/developer-dashboard',
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          }
        );

        if (!dashboardResponse.data.success) {
          throw new Error(dashboardResponse.data.message || 'Dashboard error');
        }

        setDashboardData(dashboardResponse.data.data);
      } catch (error) {
        console.error('Error:', error);

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please login again',
          });
          navigate('/signin');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error Loading Dashboard',
            text: error.response?.data?.message || 'An error occurred while loading the dashboard',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="spinner-border text-primary" role="status"></div>;
  }

  return (
    <div className="container-fluid">
      <div className="col-xl-12">
        <div className="card custom-card main-dashboard-banner overflow-hidden">
          <div className="card-body p-4">
            <div className="row justify-content-between">
              <div className="col-xxl-7 col-xl-5 col-lg-5 col-md-5 col-sm-5">
                <h4 className="mb-3 fw-medium text-fixed-white">
                  Welcome, {user?.firstName || 'Developer'}!
                </h4>
                <p className="mb-4 text-fixed-white">
                  {dashboardData?.approachingDeadlines?.length > 0
                    ? `You have ${dashboardData.approachingDeadlines.length} upcoming deadlines`
                    : 'No upcoming deadlines'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines Section */}
      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">
                Upcoming Deadlines
                <span className="badge bg-primary-transparent text-primary ms-2">
                  {dashboardData?.approachingDeadlines?.length || 0}
                </span>
              </div>
              <a href="/mytasks" className="btn btn-sm btn-primary-light">
                View All Tasks
              </a>
            </div>
            <div className="card-body">
              {dashboardData?.approachingDeadlines?.length > 0 ? (
                <UpcomingDeadlines tasks={dashboardData.approachingDeadlines} />
              ) : (
                <div className="text-center py-4">
                  <i className="ri-checkbox-circle-line fs-3 text-muted"></i>
                  <p className="text-muted mt-2">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <TaskStats stats={dashboardData?.taskStats} />
        <SkillsPolarChart skills={dashboardData?.skills} />
      </div>

      <div className="row mt-4">
        <div className="col-12">

          <TaskTimeline tasks={dashboardData?.timelineTasks} />
        </div>
      </div>
      <div className="col-12">
      <DeveloperProjects projects={dashboardData?.projects} />
</div>


{/* <TaskStats stats={dashboardData?.taskStats} />
  Additional components can be added here in the future:
  - Task statistics
  - Recent activity
*/}

    </div>
  );
}

export default DeveloperDashboard;