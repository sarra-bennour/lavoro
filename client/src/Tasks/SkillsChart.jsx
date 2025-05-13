import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const SkillsPolarChart = ({ skills }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (skills && skills.length > 0) {
      renderChart();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [skills]);

  const renderChart = () => {
    const options = {
      series: skills.map(skill => skill.count),
      chart: {
        type: 'polarArea',
        height: 350,
        animations: {
          enabled: false
        }
      },
      labels: skills.map(skill => skill.name),
      fill: {
        opacity: 0.9
      },
      stroke: {
        width: 1,
        colors: ['#fff']
      },
      colors: [
        '#3B82F6', '#EC4899', '#10B981', '#F59E0B', 
        '#6366F1', '#8B5CF6', '#EF4444', '#14B8A6',
        '#F97316', '#64748B'
      ],
      legend: {
        position: 'right',
        fontSize: '14px'
      },
      plotOptions: {
        polarArea: {
          rings: {
            strokeWidth: 1,
            strokeColor: '#e0e0e0'
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value) => `${value} ${value === 1 ? 'task' : 'tasks'}`
        }
      }
    };

    chartInstance.current = new ApexCharts(chartRef.current, options);
    chartInstance.current.render();
  };

  return (
    <div className="col-xl-6">
      <div className="card custom-card">
        <div className="card-header">
          <div className="card-title">Skills Distribution</div>
        </div>
        <div className="card-body">
          {skills?.length > 0 ? (
            <div id="polararea-basic" ref={chartRef}></div>
          ) : (
            <div className="text-center py-4">
              <i className="ri-pie-chart-line fs-3 text-muted"></i>
              <p className="text-muted mt-2">No skills data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsPolarChart;