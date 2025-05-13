import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const TaskTimeline = ({ tasks = [] }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (tasks.length > 0 && chartRef.current) {
      renderChart();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [tasks]);

  const renderChart = () => {
    const seriesData = tasks
      .filter(task => task?.deadline && task?.start_date)
      .map(task => ({
        x: task.title || 'Untitled Task',
        y: [
          new Date(task.start_date).getTime(),
          new Date(task.deadline).getTime()
        ]
      }));

    if (seriesData.length === 0) return;

    const options = {
      series: [{
        data: seriesData
      }],
      chart: {
        height: 450, // Increased height
        type: 'rangeBar',
        toolbar: { show: true }, // Show toolbar for zoom/export
        animations: { enabled: false },
        width: '100%' // Ensure full width
      },
      colors: ['#3B82F6', '#EC4899'],
      plotOptions: {
        bar: {
          horizontal: true,
          isDumbbell: true,
          dumbbellColors: [['#3B82F6', '#EC4899']],
          barHeight: '10%' // Thicker bars for better visibility
        }
      },
      title: {
        text: 'Task Timeline',
        align: 'center',
        style: {
          fontSize: '18px', // Larger title
          fontWeight: 'bold'
        }
      },
      legend: {
        show: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          gradientToColors: ['#EC4899'],
          inverseColors: false,
          stops: [0, 100]
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val; // Just show the task name
        },
        style: {
          colors: ['#fff'],
          fontSize: '14px', // Larger font
          fontWeight: 'bold'
        },
        offsetX: 10, // Move labels further right
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 6,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.8
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          formatter: function(val) {
            return new Date(val).toLocaleDateString();
          },
          style: {
            fontSize: '12px'
          }
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '14px' // Larger task names
          }
        }
      },
      grid: {
        padding: {
          left: 20, // More left padding
          right: 20  // More right padding
        },
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },
      tooltip: {
        custom: function({ seriesIndex, dataPointIndex, w }) {
          const task = w.config.series[seriesIndex].data[dataPointIndex];
          const start = new Date(task.y[0]);
          const end = new Date(task.y[1]);
          const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          
          return `
            <div style="padding: 8px; background: #fff; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1)">
              <strong style="font-size: 14px;">${task.x}</strong>
              <div style="margin-top: 6px;">
                <span style="color: #3B82F6">Start:</span> ${start.toLocaleDateString()}
              </div>
              <div>
                <span style="color: #EC4899">End:</span> ${end.toLocaleDateString()}
              </div>
              <div style="margin-top: 4px; font-weight: bold">
                Duration: ${duration} days
              </div>
            </div>
          `;
        }
      }
    };

    chartInstance.current = new ApexCharts(chartRef.current, options);
    chartInstance.current.render();
  };

  return (
    <div className="col-xl-12"> {/* Changed from col-xl-6 to col-xl-12 for full width */}
      <div className="card custom-card">
        <div className="card-header">
          <div className="card-title">Task Timeline</div>
        </div>
        <div className="card-body p-0" style={{ minHeight: '500px' }}> {/* Remove padding and set min height */}
          {tasks.length > 0 ? (
            <div 
              id="dumbbell-timeline" 
              ref={chartRef}
              style={{ width: '100%', padding: '20px' }} // Full width with padding
            ></div>
          ) : (
            <div className="text-center py-4">
              <i className="ri-calendar-todo-line fs-3 text-muted"></i>
              <p className="text-muted mt-2">No tasks with start/end dates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskTimeline;