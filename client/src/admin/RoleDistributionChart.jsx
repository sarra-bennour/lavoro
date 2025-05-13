import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const RoleDistributionChart = () => {
  const [chartData, setChartData] = useState({
    roles: [],
    total: 0,
    loading: true,
    error: null
  });

  const COLORS = ['#ff6384', '#36a2eb', '#9966ff', '#4bc0c0', '#8884D8'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://lavoro-back.onrender.com/admin/role-statistics', {
          withCredentials: true
        });
        
        const total = response.data.data.reduce((sum, role) => sum + role.userCount, 0);
        
        setChartData({
          roles: response.data.data,
          total,
          loading: false,
          error: null
        });
      } catch (err) {
        setChartData({
          roles: [],
          total: 0,
          loading: false,
          error: err.response?.data?.message || 'Failed to load role data'
        });
      }
    };

    fetchData();
  }, []);

  if (chartData.loading) return <div className="text-center p-3">Loading role data...</div>;
  if (chartData.error) return <div className="text-danger p-3">{chartData.error}</div>;

  return (
    <div className="col-xxl-3">
      <div className="card custom-card">
        <div className="card-header justify-content-between">
          <div className="card-title">Role Distribution</div>
          
        </div>
        
        <div className="card-body px-0" style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.roles}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="userCount"
                nameKey="RoleName"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.roles.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} users`, 'Count']}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card-body pt-0">
          <div className="p-3 bg-light d-flex gap-2 rounded align-items-center flex-wrap">
            <div className="avatar avatar-sm bg-primary-transparent text-primary rounded-circle">
              <i className="ri-group-line fs-18"></i>
            </div>
            <div>
              <h5 className="mb-0">{chartData.total}</h5>
              <div className="fw-medium text-muted">Total Users</div>
            </div>
            <span className="badge bg-success ms-auto">
              {chartData.roles.length} Roles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDistributionChart;

