import React from 'react';
import { RiTaskLine, RiCheckboxCircleLine, RiProgress1Line, RiEyeLine, RiAlertLine } from 'react-icons/ri';
import ApexCharts from 'apexcharts';

const TaskStats = ({ stats }) => {
  // Initialize chart when component mounts
  React.useEffect(() => {
    if (stats) {
      // Clear any existing chart first
      const chartElement = document.querySelector("#radialbar-multiple");
      if (chartElement) {
        chartElement.innerHTML = '';
      }

      const chart = renderChart();

      // Cleanup function to destroy chart when component unmounts or stats change
      return () => {
        if (chart) {
          chart.destroy();
        }
      };
    }
  }, [stats]);

  const renderChart = () => {
    // Calculate percentages of total tasks
    const total = stats?.total || 1; // Avoid division by zero
    const completedPercent = Math.round((stats?.completed || 0) / total * 100);
    const inProgressPercent = Math.round((stats?.inProgress || 0) / total * 100);
    const inReviewPercent = Math.round((stats?.inReview || 0) / total * 100);
    const notStartedPercent = Math.round((stats?.notStarted || 0) / total * 100);

    const options = {
      series: [
        completedPercent,
        inProgressPercent,
        inReviewPercent,
        notStartedPercent
      ],
      chart: {
        height: 350,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '22px',
            },
            value: {
              fontSize: '16px',
              formatter: function (val) {
                // Show only the percentage
                return `${val}%`;
              }
            },
            total: {
              show: true,
              label: 'Total Tasks',
              formatter: function () {
                return stats?.total || 0;
              }
            }
          }
        }
      },
      labels: ['Completed', 'In Progress', 'In Review', 'Not Started'],
      colors: ['#5a67d8', '#8b5cf6', '#f59e0b', '#ef4444'],
      legend: {
        show: true,
        position: 'bottom'
      }
    };

    const chart = new ApexCharts(document.querySelector("#radialbar-multiple"), options);
    chart.render();

    // Return the chart instance so it can be destroyed when needed
    return chart;
  };

  return (
    <div className="col-xl-6">
      <div className="card custom-card">
        <div className="card-header justify-content-between">
          <div className="card-title">Task Status Distribution</div>
          <div className="d-flex">
            {stats && (
              <span className="badge bg-primary-transparent text-primary">
                Total: {stats.total}
              </span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div id="radialbar-multiple"></div>

          {/* Detailed Stats Breakdown */}
          {stats && (
            <div className="row mt-4">
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="p-3 bg-light-transparent rounded text-center">
                  <div className="fs-4 fw-semibold text-primary">{stats.completed}</div>
                  <div className="text-muted">Completed</div>
                  <div className="fs-12 text-success">
                    {Math.round((stats.completed / stats.total) * 100)}%
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="p-3 bg-light-transparent rounded text-center">
                  <div className="fs-4 fw-semibold text-purple">{stats.inProgress}</div>
                  <div className="text-muted">In Progress</div>
                  <div className="fs-12 text-primary">
                    {Math.round((stats.inProgress / stats.total) * 100)}%
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="p-3 bg-light-transparent rounded text-center">
                  <div className="fs-4 fw-semibold text-warning">{stats.inReview}</div>
                  <div className="text-muted">In Review</div>
                  <div className="fs-12 text-warning">
                    {Math.round((stats.inReview / stats.total) * 100)}%
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="p-3 bg-light-transparent rounded text-center">
                  <div className="fs-4 fw-semibold text-danger">{stats.notStarted}</div>
                  <div className="text-muted">Not Started</div>
                  <div className="fs-12 text-danger">
                    {Math.round((stats.notStarted / stats.total) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskStats;