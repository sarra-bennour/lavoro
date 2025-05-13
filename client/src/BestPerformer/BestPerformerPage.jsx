import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BestPerformer from '../Tasks/BestPerformer';
import PerformancePodium from '../Tasks/PerformancePodium';

const BestPerformerPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch actual statistics from the API
        const response = await axios.get('https://lavoro-back.onrender.com/teamMember/best-performer', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Extract best performer statistics
        const performerStats = response.data.stats || {};

        // Update global statistics
        setStats({
          totalTasks: performerStats.tasksCompleted || 0,
          completedOnTime: performerStats.tasksOnTime || 0,
          completedEarly: performerStats.tasksEarly || 0,
          completedLate: performerStats.tasksLate || 0,
          averagePoints: response.data.performancePoints || 0
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 mb-4">
          <h2 className="page-title">Performance Dashboard</h2>
          <p className="text-muted">Discover the top-performing employees and celebrate the champions of the month</p>
        </div>
      </div>

      {/* General statistics */}
      {!loading && stats && (
        <div className="row mb-4">
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-primary-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-primary text-white">
                      <i className="ri-task-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.totalTasks}</h6>
                    <p className="text-muted mb-0 fs-12">Total tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-success-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-success text-white">
                      <i className="ri-check-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.completedOnTime}</h6>
                    <p className="text-muted mb-0 fs-12">Tasks on time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-warning-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-warning text-white">
                      <i className="ri-time-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.completedEarly}</h6>
                    <p className="text-muted mb-0 fs-12">Tasks completed early</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div className="card custom-card bg-info-transparent">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <span className="avatar avatar-md bg-info text-white">
                      <i className="ri-bar-chart-line"></i>
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-0">{stats.averagePoints}</h6>
                    <p className="text-muted mb-0 fs-12">Average points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Best performer */}
        <div className="col-lg-7 col-md-12 mb-4">
          <BestPerformer />
        </div>

        {/* Performance podium */}
        <div className="col-lg-5 col-md-12 mb-4">
          <PerformancePodium />
        </div>
      </div>

      {/* Points system explanation */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">How the point system works</div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="fw-semibold mb-3">Point allocation</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-checkbox-circle-line text-success me-2"></i>
                        Task completed within deadline
                      </div>
                      <span className="badge bg-success rounded-pill">+1 point</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-time-line text-primary me-2"></i>
                        Completed 1 hour before estimated time
                      </div>
                      <span className="badge bg-primary rounded-pill">+2 points</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-speed-up-line text-warning me-2"></i>
                        Completed 2 hours before, etc.
                      </div>
                      <span className="badge bg-warning rounded-pill">+3 points</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="ri-close-circle-line text-danger me-2"></i>
                        Task not completed on time
                      </div>
                      <span className="badge bg-danger rounded-pill">-1 point</span>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-semibold mb-3">System benefits</h6>
                  <div className="alert alert-primary-transparent">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="ri-trophy-line fs-24"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold">Rewards</h6>
                        <p className="mb-0">Employees with the most points can receive rewards and special recognition.</p>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-success-transparent mt-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="ri-team-line fs-24"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold">Team motivation</h6>
                        <p className="mb-0">Encourages healthy competition and improves the overall team productivity.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPerformerPage;
