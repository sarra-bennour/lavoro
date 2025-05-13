import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UsersList from './usersList';
import DeleteRequests from './deleteRequests';
import RoleDistributionChart from './RoleDistributionChart'
import UpcomingDeadlinesCarousel from './UpcomingDeadlines';
function AdminDashboard() {
  const navigate = useNavigate();

  
  
  return (
    <div className="container-fluid">
      <div className="col-xl-12">
        <div className="card custom-card main-dashboard-banner overflow-hidden">
          <div className="card-body p-4">
            <div className="row justify-content-between">
              <div className="col-xxl-7 col-xl-5 col-lg-5 col-md-5 col-sm-5">
                <h4 className="mb-3 fw-medium text-fixed-white">Welcome, Admin!</h4>
                <p className="mb-4 text-fixed-white">Here's an overview of your dashboard.</p>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
      {/* Upcoming Deadlines Section */}
      <UpcomingDeadlinesCarousel/>
      
      {/* Role Distribution Chart Section */}
      <RoleDistributionChart/>
      {/* Pending Requests Section */}
      <DeleteRequests />

      {/* Users List Section */}
      <UsersList onViewActivity={(userId) => navigate(`/user-activity/${userId}`)} />
      
    
      
    </div>
  );
}

export default AdminDashboard;