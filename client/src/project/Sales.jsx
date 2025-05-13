
import '../../public/assets/libs/flatpickr/flatpickr.min.css'
import '../../public/assets/libs/apexcharts/apexcharts.min.js'
import '../../public/assets/js/sales-dashboard.js'
import '../../public/assets/js/custom.js'
import 'flatpickr/dist/flatpickr.min.css';
import React, { useEffect, useState } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import ApexCharts from 'apexcharts';
import 'apexcharts/dist/apexcharts.css';
import '../../public/assets/libs/flatpickr/flatpickr.min.css';
import '../../public/assets/libs/apexcharts/apexcharts.min.js';
import '../../public/assets/js/custom.js';
import axios from 'axios';

export default function Sales() {

  const [projectCount, setProjectCount] = useState(0);



  useEffect(() => {

    const fetchProjectCount = async () => {
      try {
        const response = await axios.get("https://lavoro-back.onrender.com/project/countProject");
        setProjectCount(response.data.count);
      } catch (error) {
        console.error("Erreur lors de la récupération du nombre de projets :", error);
      }
    };

    fetchProjectCount();

    // Initialize flatpickr for date pickers
    flatpickr("#daterange", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });

    // Sales Overview Chart
    const salesOverviewOptions = {
      series: [{
        name: 'Growth',
        type: "column",
        data: [140, 120, 190, 364, 140, 230, 166, 340, 260, 260, 120, 320]
      }, {
        name: "Profit",
        type: "area",
        data: [180, 620, 476, 220, 520, 680, 435, 515, 638, 454, 525, 230],
      }, {
        name: "Sales",
        type: "line",
        data: [200, 330, 110, 130, 380, 420, 580, 335, 375, 638, 454, 480],
      }],
      chart: {
        redrawOnWindowResize: true,
        height: 315,
        type: 'bar',
        toolbar: {
          show: false
        },
        dropShadow: {
          enabled: true,
          enabledOnSeries: undefined,
          top: 7,
          left: 0,
          blur: 1,
          color: ["transparent", 'transparent', 'rgb(227, 84, 212)'],
          opacity: 0.05,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '18%',
          borderRadius: 2
        },
      },
      grid: {
        borderColor: '#f1f1f1',
        strokeDashArray: 3
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: [0, 2, 2],
        curve: "smooth",
      },
      legend: {
        show: true,
        fontSize: "12px",
        position: 'bottom',
        horizontalAlign: 'center',
        fontWeight: 500,
        height: 40,
        offsetX: 0,
        offsetY: 10,
        labels: {
          colors: '#9ba5b7',
        },
        markers: {
          width: 7,
          height: 7,
          shape: "circle",
          size: 3.5,
          strokeWidth: 0,
          strokeColor: '#fff',
          fillColors: undefined,
          radius: 12,
          offsetX: 0,
          offsetY: 0
        },
      },
      colors: ['var(--primary-color)', "rgba(119, 119, 142, 0.05)", 'rgb(227, 84, 212)'],
      yaxis: {
        title: {
          style: {
            color: '#adb5be',
            fontSize: '14px',
            fontFamily: 'poppins, sans-serif',
            fontWeight: 600,
            cssClass: 'apexcharts-yaxis-label',
          },
        },
        labels: {
          formatter: function (y) {
            return y.toFixed(0) + "";
          },
          show: true,
          style: {
            colors: "#8c9097",
            fontSize: '11px',
            fontWeight: 600,
            cssClass: 'apexcharts-xaxis-label',
          },
        }
      },
      xaxis: {
        type: "month",
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Agu', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisBorder: {
          show: true,
          color: 'rgba(119, 119, 142, 0.05)',
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          borderType: 'solid',
          color: 'rgba(119, 119, 142, 0.05)',
          width: 6,
          offsetX: 0,
          offsetY: 0
        },
        labels: {
          rotate: -90,
          style: {
            colors: "#8c9097",
            fontSize: '11px',
            fontWeight: 600,
            cssClass: 'apexcharts-xaxis-label',
          },
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + "%";
            }
            return y;
          },
        },
      },
      fill: {
        colors: undefined,
        opacity: 0.025,
        type: ['solid', 'solid'],
        gradient: {
          shade: 'light',
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: ['#fdc530'],
          inverseColors: true,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 50, 100],
          colorStops: ['#fdc530']
        }
      }
    };

    const salesOverviewChart = new ApexCharts(document.querySelector("#sales-overview"), salesOverviewOptions);
    salesOverviewChart.render();

    // Order Statistics Chart
    const orderStatisticsOptions = {
      series: [1754, 634, 878, 470],
      labels: ["Delivered", "Cancelled", "Pending", "Returned"],
      chart: {
        height: 199,
        type: 'donut',
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        height: 52,
        markers: {
          width: 8,
          height: 8,
          radius: 2,
          shape: "circle",
          size: 4,
          strokeWidth: 0
        },
        offsetY: 10,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'round',
        colors: "#fff",
        width: 0,
        dashArray: 0,
      },
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 10,
          expandOnClick: false,
          donut: {
            size: '80%',
            background: 'transparent',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '20px',
                color: '#495057',
                offsetY: -25
              },
              value: {
                show: true,
                fontSize: '15px',
                color: undefined,
                offsetY: -20,
                formatter: function (val) {
                  return val + "%"
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '22px',
                fontWeight: 600,
                color: '#495057',
              }
            }
          }
        }
      },
      grid: {
        padding: {
          bottom: -100
        }
      },
      colors: ["var(--primary-color)", "rgba(227, 84, 212, 1)", "rgba(255, 93, 159, 1)", "rgba(255, 142, 111, 1)"],
    };

    const orderStatisticsChart = new ApexCharts(document.querySelector("#orders"), orderStatisticsOptions);
    orderStatisticsChart.render();

    // Sales Statistics Chart
    const salesStatisticsOptions = {
      series: [{
        name: 'Total',
        type: 'bar',
        data: [80, 90, 59, 86, 120, 165, 115]
      }, {
        name: 'This Year',
        type: 'bar',
        data: [55, 25, 25, 165, 75, 64, 70]
      }, {
        name: 'Last Year',
        type: 'bar',
        data: [71, 97, 72, 52, 73, 51, 71]
      }],
      chart: {
        height: 265,
        type: 'line',
        stacked: {
          enabled: true,
        },
        toolbar: {
          show: false,
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        strokeDashArray: 3
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        markers: {
          shape: "circle",
          size: 4,
          strokeWidth: 0
        },
      },
      stroke: {
        curve: 'smooth',
        width: [0],
      },
      plotOptions: {
        bar: {
          columnWidth: "30%",
          borderRadius: [3],
          borderRadiusWhenStacked: "all",
        }
      },
      colors: ["var(--primary-color)", "rgba(227, 84, 212, 1)", "rgba(255, 142, 111, 1)"],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    };

    const salesStatisticsChart = new ApexCharts(document.querySelector("#sales-statistics"), salesStatisticsOptions);
    salesStatisticsChart.render();

    // Line Graphs
    const lineGraphOptions = (elementId, color, data) => ({
      chart: {
        type: 'line',
        height: 30,
        width: 100,
        sparkline: {
          enabled: true
        },
        dropShadow: {
          enabled: false,
          blur: 3,
          opacity: 0.2,
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        lineCap: 'butt',
        colors: undefined,
        width: 2,
        dashArray: 0,
      },
      fill: {
        gradient: {
          enabled: false
        }
      },
      series: [{
        name: 'Total Income',
        data: data
      }],
      yaxis: {
        min: 0
      },
      colors: [color],
    });

    const lineGraph1 = new ApexCharts(document.querySelector("#line-graph1"), lineGraphOptions("#line-graph1", 'rgb(126, 103, 221)', [0, 30, 10, 35, 26, 31, 14, 22, 40, 12]));
    lineGraph1.render();

    const lineGraph2 = new ApexCharts(document.querySelector("#line-graph2"), lineGraphOptions("#line-graph2", 'rgb(227, 84, 212)', [0, 20, 15, 25, 15, 25, 6, 25, 32, 15]));
    lineGraph2.render();

    const lineGraph3 = new ApexCharts(document.querySelector("#line-graph3"), lineGraphOptions("#line-graph3", 'rgb(255, 93, 159)', [0, 10, 30, 12, 16, 25, 4, 35, 26, 15]));
    lineGraph3.render();

    const lineGraph4 = new ApexCharts(document.querySelector("#line-graph4"), lineGraphOptions("#line-graph4", 'rgb(255, 142, 111)', [0, 12, 19, 26, 10, 18, 8, 17, 35, 14]));
    lineGraph4.render();

    const lineGraph5 = new ApexCharts(document.querySelector("#line-graph5"), lineGraphOptions("#line-graph5", 'rgb(158, 92, 247)', [0, 12, 19, 17, 35, 14, 26, 10, 18, 8]));
    lineGraph5.render();
  }, []);







    return(


<>
        <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
          <div>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Dashboards</a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Sales
              </li>
            </ol>
            <h1 className="page-title fw-medium fs-18 mb-0">Sales Dashboard</h1>
          </div>

        </div>
        {/* End::page-header */}
        {/* Start:: row-1 */}
        <div className="row">
          <div className="col-xl-8">
            <div className="row">
              <div className="col-xxl-3 col-xl-6">
                <div className="card custom-card overflow-hidden main-content-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                      <div>
                        <span className="text-muted d-block mb-1 text-nowrap">
                          Total Projects
                        </span>
                        <h4 className="fw-medium mb-0">{projectCount}</h4>
                      </div>
                      <div className="lh-1">
                        <span className="avatar avatar-md avatar-rounded bg-primary">
                          <i className="ri-shopping-cart-line fs-5" />
                        </span>
                      </div>
                    </div>
                    <div className="text-muted fs-13">
                      Increased By{" "}
                      <span className="text-success">
                        2.56%
                        <i className="ri-arrow-up-line fs-16" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-6">
                <div className="card custom-card overflow-hidden main-content-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                      <div>
                        <span className="text-muted d-block mb-1 text-nowrap">
                          Total Users
                        </span>
                        <h4 className="fw-medium mb-0">31,876</h4>
                      </div>
                      <div className="lh-1">
                        <span className="avatar avatar-md avatar-rounded bg-primary1">
                          <i className="ri-user-line fs-5" />
                        </span>
                      </div>
                    </div>
                    <div className="text-muted fs-13">
                      Increased By{" "}
                      <span className="text-success">
                        0.34%
                        <i className="ri-arrow-up-line fs-16" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-6">
                <div className="card custom-card overflow-hidden main-content-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                      <div>
                        <span className="text-muted d-block mb-1 text-nowrap">
                          Total Revenue
                        </span>
                        <h4 className="fw-medium mb-0">$34,241</h4>
                      </div>
                      <div className="lh-1">
                        <span className="avatar avatar-md avatar-rounded bg-primary2">
                        <i class="ri-exchange-dollar-line fs-30"></i>                        </span>
                      </div>
                    </div>
                    <div className="text-muted fs-13">
                      Increased By{" "}
                      <span className="text-success">
                        7.66%
                        <i className="ri-arrow-up-line fs-16" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3 col-xl-6">
                <div className="card custom-card overflow-hidden main-content-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                      <div>
                        <span className="text-muted d-block mb-1 text-nowrap">
                          Total Sales
                        </span>
                        <h4 className="fw-medium mb-0">1,76,586</h4>
                      </div>
                      <div className="lh-1">
                        <span className="avatar avatar-md avatar-rounded bg-primary3">
                          <i className="ri-bar-chart-2-line fs-5" />
                        </span>
                      </div>
                    </div>
                    <div className="text-muted fs-13">
                      Decreased By{" "}
                      <span className="text-danger">
                        0.74%
                        <i className="ri-arrow-down-line fs-16" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-8 col-xl-6">
                <div className="card custom-card">
                  <div className="card-header justify-content-between">
                    <div className="card-title">Sales Overview</div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="btn btn-sm btn-light text-muted dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="true"
                      >
                        {" "}
                        Sort By
                      </a>
                      <ul
                        className="dropdown-menu"
                        role="menu"
                        data-popper-placement="bottom-end"
                      >
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            This Week
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            Last Week
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            This Month
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card-body">
                    <div id="sales-overview" />
                  </div>
                </div>
              </div>
              <div className="col-xxl-4 col-xl-6">
                <div className="card custom-card overflow-hidden">
                  <div className="card-header pb-0 justify-content-between">
                    <div className="card-title">Order Statistics</div>
                    <div className="dropdown">
                      <a
                        aria-label="anchor"
                        href="javascript:void(0);"
                        className="btn btn-light btn-icons btn-sm text-muted"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="ri-more-2-line" />
                      </a>
                      <ul className="dropdown-menu" role="menu">
                        <li className="border-bottom">
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            Today
                          </a>
                        </li>
                        <li className="border-bottom">
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            This Week
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            Last Week
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card-body py-4 px-3">
                    <div className="d-flex gap-3 mb-3 flex-wrap">
                      <div className="avatar avatar-md bg-primary-transparent">
                      <i className="ri-trending-up fs-5"></i>
                        </div>
                      <div className="flex-fill d-flex align-items-start justify-content-between flex-wrap">
                        <div>
                          <span className="fs-11 mb-1 d-block fw-medium">
                            TOTAL ORDERS
                          </span>
                          <div className="d-flex align-items-center justify-content-between">
                            <h4 className="mb-0 d-flex align-items-center flex-wrap">
                              3,736
                              <span className="text-success fs-12 ms-2 op-1">
                                <i className="ti ti-trending-up align-middle me-1" />
                                0.57%
                              </span>
                            </h4>
                          </div>
                        </div>
                        <a
                          href="javascript:void(0);"
                          className="text-success fs-12 text-decoration-underline"
                        >
                          Earnings ?
                        </a>
                      </div>
                    </div>
                    <div id="orders" className="my-2" />
                  </div>
                  <div className="card-footer border-top border-block-start-dashed">
                    <div className="d-grid">
                      <button className="btn btn-primary-ghost btn-wave fw-medium waves-effect waves-light table-icon">
                        Complete Statistics
                        <i className="ti ti-arrow-narrow-right ms-2 fs-16 d-inline-block" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="row">
              <div className="col-xl-12">
                <div className="card custom-card main-dashboard-banner overflow-hidden">
                  <div className="card-body p-4">
                    <div className="row justify-content-between">
                      <div className="col-xxl-7 col-xl-5 col-lg-5 col-md-5 col-sm-5">
                        <h4 className="mb-3 fw-medium text-fixed-white">
                          Upgrade to get more
                        </h4>
                        <p className="mb-4 text-fixed-white">
                          Maximize sales insights. Optimize performance. Achieve
                          success with pro.
                        </p>
                        <a
                          href="javascript:void(0);"
                          className="fw-medium text-fixed-white text-decoration-underline"
                        >
                          Upgrade To Pro
                          <i className="ti ti-arrow-narrow-right" />
                        </a>
                      </div>
                      <div className="col-xxl-4 col-xl-7 col-lg-7 col-md-7 col-sm-7 d-sm-block d-none text-end my-auto">
                        <img
                          src="../assets/images/media/media-86.png"
                          alt=""
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-12">
                <div className="card custom-card overflow-hidden">
                  <div className="card-header justify-content-between">
                    <div className="card-title">Top Selling Categories</div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="btn btn-sm btn-light text-muted dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="true"
                      >
                        {" "}
                        Sort By
                      </a>
                      <ul
                        className="dropdown-menu"
                        role="menu"
                        data-popper-placement="bottom-end"
                      >
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            This Week
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            Last Week
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0);"
                          >
                            This Month
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="p-3 pb-0">
                      <div className="progress-stacked progress-sm mb-2 gap-1">
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: "25%" }}
                          aria-valuenow={25}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                        <div
                          className="progress-bar bg-primary1"
                          role="progressbar"
                          style={{ width: "15%" }}
                          aria-valuenow={15}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                        <div
                          className="progress-bar bg-primary2"
                          role="progressbar"
                          style={{ width: "15%" }}
                          aria-valuenow={25}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                        <div
                          className="progress-bar bg-primary3"
                          role="progressbar"
                          style={{ width: "25%" }}
                          aria-valuenow={35}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                        <div
                          className="progress-bar bg-secondary"
                          role="progressbar"
                          style={{ width: "20%" }}
                          aria-valuenow={35}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div>Overall Sales</div>
                        <div className="h6 mb-0">
                          <span className="text-success me-2 fs-11">
                            2.74%
                            <i className="ti ti-arrow-narrow-up" />
                          </span>
                          1,25,875
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table text-nowrap">
                        <tbody>
                          <tr>
                            <td>
                              <span className="fw-medium top-category-name one">
                                Clothing
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">31,245</span>
                            </td>
                            <td className="text-center">
                              <span className="text-muted fs-12">
                                25% Gross
                              </span>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-success">
                                0.45% <i className="ti ti-trending-up" />
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span className="fw-medium top-category-name two">
                                Electronics
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">29,553</span>
                            </td>
                            <td className="text-center">
                              <span className="text-muted fs-12">
                                16% Gross
                              </span>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-warning">
                                0.27% <i className="ti ti-trending-up" />
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span className="fw-medium top-category-name three">
                                Grocery
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">24,577</span>
                            </td>
                            <td className="text-center">
                              <span className="text-muted fs-12">
                                22% Gross
                              </span>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-secondary">
                                0.63% <i className="ti ti-trending-up" />
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span className="fw-medium top-category-name four">
                                Automobiles
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">19,278</span>
                            </td>
                            <td className="text-center">
                              <span className="text-muted fs-12">
                                18% Gross
                              </span>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-primary1">
                                1.14% <i className="ti ti-trending-down" />
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="border-bottom-0">
                              <span className="fw-medium top-category-name five">
                                others
                              </span>
                            </td>
                            <td className="border-bottom-0">
                              <span className="fw-medium">15,934</span>
                            </td>
                            <td className="text-center border-bottom-0">
                              <span className="text-muted fs-12">
                                15% Gross
                              </span>
                            </td>
                            <td className="text-end border-bottom-0">
                              <span className="badge bg-primary">
                                3.87% <i className="ti ti-trending-up" />
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End:: row-1 */}
        {/* Start:: row-2 */}
        <div className="row">
          <div className="col-xxl-3 col-xl-6">
            <div className="card custom-card overflow-hidden">
              <div className="card-header justify-content-between">
                <div className="card-title">Latest Transactions</div>
                <a
                  href="javascript:void(0);"
                  className="btn btn-light btn-wave btn-sm text-muted"
                >
                  View All
                  <i className="ti ti-arrow-narrow-right ms-1" />
                </a>
              </div>
              <div className="card-body p-0 pt-1">
                <div className="table-responsive">
                  <table className="table text-nowrap">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/4.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">SwiftBuds</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">$39.99</span>
                        </td>
                        <td>
                          <span className="badge bg-primary">Success</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/6.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">CozyCloud Pillow</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">$19.95</span>
                        </td>
                        <td>
                          <span className="badge bg-primary1">Pending</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/3.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">AquaGrip Bottle</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">$9.99</span>
                        </td>
                        <td>
                          <span className="badge bg-primary2">Failed</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/1.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">GlowLite Lamp</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">$24.99</span>
                        </td>
                        <td>
                          <span className="badge bg-primary3">Success</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/2.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">Bitvitamin</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">$26.45</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">Success</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-bottom-0">
                          <div className="d-flex align-items-center gap-2">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/ecommerce/jpg/5.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div className="fw-medium">FitTrack</div>
                          </div>
                        </td>
                        <td className="border-bottom-0">
                          <span className="fw-medium">$49.95</span>
                        </td>
                        <td className="border-bottom-0">
                          <span className="badge bg-warning">Success</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-6">
            <div className="card custom-card">
              <div className="card-header justify-content-between">
                <div className="card-title">Recent Activity</div>
                <a
                  href="javascript:void(0);"
                  className="btn btn-light btn-wave btn-sm text-muted waves-effect waves-light"
                >
                  View All
                </a>
              </div>
              <div className="card-body">
                <ul className="list-unstyled recent-activity-list">
                  <li>
                    <div>
                      <div>
                        <div className="fw-medium fs-14">John Doe</div>
                        <span className="fs-12 activity-time">12 Hrs</span>
                      </div>
                      <span className="d-block text-muted">
                        Updated the product description for{" "}
                        <span className="text-primary fw-medium">Widget X</span>
                        .
                      </span>
                    </div>
                  </li>
                  <li>
                    <div>
                      <div>
                        <div className="fw-medium fs-14">Jane Smith</div>
                        <span className="fs-12 activity-time">4:32pm</span>
                      </div>
                      <span className="d-block text-muted">
                        added a{" "}
                        <span className="fw-medium text-dark">new user</span>{" "}
                        with username{" "}
                        <span className="fw-medium text-primary1">
                          janesmith89.
                        </span>
                      </span>
                    </div>
                  </li>
                  <li>
                    <div>
                      <div>
                        <div className="fw-medium fs-14">Michael Brown</div>
                        <span className="fs-12 activity-time">11:45am</span>
                      </div>
                      <span className="d-block text-muted">
                        Changed the status of order{" "}
                        <a
                          href="javascript:void(0);"
                          className="fw-medium text-dark text-decoration-underline"
                        >
                          #12345
                        </a>{" "}
                        to{" "}
                        <span className="fw-medium text-primary2">
                          Shipped.
                        </span>
                      </span>
                    </div>
                  </li>
                  <li>
                    <div>
                      <div>
                        <div className="fw-medium fs-14">David Wilson</div>
                        <span className="fs-12 activity-time">9:27am</span>
                      </div>
                      <span className="d-block text-muted">
                        added{" "}
                        <span className="fw-medium text-primary3">
                          John Smith
                        </span>{" "}
                        to academy group this day.
                      </span>
                    </div>
                  </li>
                  <li>
                    <div>
                      <div>
                        <div className="fw-medium fs-14">Robert Jackson</div>
                        <span className="fs-12 activity-time">8:56pm</span>
                      </div>
                      <span className="d-block text-muted">
                        added a comment to the task{" "}
                        <span className="fw-medium text-secondary">
                          Update website layout.
                        </span>
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-6">
            <div className="card custom-card">
              <div className="card-header justify-content-between">
                <div className="card-title">Sales Statistics</div>
                <div className="dropdown">
                  <a
                    href="javascript:void(0);"
                    className="btn btn-sm btn-light text-muted dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="true"
                  >
                    {" "}
                    Sort By
                  </a>
                  <ul
                    className="dropdown-menu"
                    role="menu"
                    data-popper-placement="bottom-end"
                  >
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);">
                        This Week
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);">
                        Last Week
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);">
                        This Month
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 justify-content-between flex-fill pb-3">
                  <div className="py-3 px-4 rounded border border-dashed bg-light">
                    <span>Total Sales</span>
                    <p className="fw-medium fs-14 mb-0">$3.478B</p>
                  </div>
                  <div className="py-3 px-4 rounded border border-dashed bg-light">
                    <span>This Year</span>
                    <p className="text-success fw-medium fs-14 mb-0">
                      4,25,349
                    </p>
                  </div>
                  <div className="py-3 px-4 rounded border border-dashed bg-light">
                    <span>Last Year</span>
                    <p className="text-danger fw-medium fs-14 mb-0">3,41,622</p>
                  </div>
                </div>
                <div id="sales-statistics" />
              </div>
            </div>
          </div>
          <div className="col-xxl-3 col-xl-6">
            <div className="card custom-card overflow-hidden">
              <div className="card-header pb-0 justify-content-between">
                <div className="card-title">Overall Statistics</div>
                <a
                  href="javascript:void(0);"
                  className="btn btn-light btn-wave btn-sm text-muted waves-effect waves-light"
                >
                  View All
                </a>
              </div>
              <div className="card-body">
                <ul className="list-group activity-feed">
                  <li className="list-group-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="lh-1">
                        <p className="mb-2 fs-13 text-muted">Total Expenses</p>
                        <h6 className="fw-medium mb-0">
                          $134,032
                          <span className="fs-12 text-success ms-2 fw-normal d-inline-block">
                            0.45%
                            <i className="ti ti-trending-up ms-1" />
                          </span>
                        </h6>
                      </div>
                      <div className="text-end">
                        <div id="line-graph1" />
                        <a href="javascript:void(0);" className="fs-12">
                          <span>See more</span>
                          <span className="table-icon">
                            <i className="ms-1 d-inline-block ri-arrow-right-line" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="lh-1">
                        <p className="mb-2 fs-13 text-muted">General Leads</p>
                        <h6 className="fw-medium mb-0">
                          74,354
                          <span className="fs-12 text-danger ms-2 fw-normal d-inline-block">
                            3.84%
                            <i className="ti ti-trending-down ms-1" />
                          </span>
                        </h6>
                      </div>
                      <div className="text-end">
                        <div id="line-graph2" />
                        <a href="javascript:void(0);" className="fs-12">
                          <span>See more</span>
                          <span className="table-icon">
                            <i className="ms-1 d-inline-block ri-arrow-right-line" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="lh-1">
                        <p className="mb-2 fs-13 text-muted">Churn Rate</p>
                        <h6 className="fw-medium mb-0">
                          6.02%
                          <span className="fs-12 text-success ms-2 fw-normal d-inline-block">
                            0.72%
                            <i className="ti ti-trending-up ms-1" />
                          </span>
                        </h6>
                      </div>
                      <div className="text-end">
                        <div id="line-graph3" />
                        <a href="javascript:void(0);" className="fs-12">
                          <span>See more</span>
                          <span className="table-icon">
                            <i className="ms-1 d-inline-block ri-arrow-right-line" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="lh-1">
                        <p className="mb-2 fs-13 text-muted">New Users</p>
                        <h6 className="fw-medium mb-0">
                          7,893
                          <span className="fs-12 text-success ms-2 fw-normal d-inline-block">
                            11.05%
                            <i className="ti ti-trending-up ms-1" />
                          </span>
                        </h6>
                      </div>
                      <div className="text-end">
                        <div id="line-graph4" />
                        <a href="javascript:void(0);" className="fs-12">
                          <span>See more</span>
                          <span className="table-icon">
                            <i className="ms-1 d-inline-block ri-arrow-right-line" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="lh-1">
                        <p className="mb-2 fs-13 text-muted">Returning Users</p>
                        <h6 className="fw-medium mb-0">
                          3,258
                          <span className="fs-12 text-success ms-2 fw-normal d-inline-block">
                            1.69%
                            <i className="ti ti-trending-up ms-1" />
                          </span>
                        </h6>
                      </div>
                      <div className="text-end">
                        <div id="line-graph5" />
                        <a href="javascript:void(0);" className="fs-12">
                          <span>See more</span>
                          <span className="table-icon">
                            <i className="ms-1 d-inline-block ri-arrow-right-line" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* End:: row-2 */}
        {/* Start:: row-3 */}
        <div className="row">
          <div className="col-xl-9">
            <div className="card custom-card overflow-hidden">
              <div className="card-header justify-content-between">
                <div className="card-title">Recent Orders</div>
                <a
                  href="javascript:void(0);"
                  className="btn btn-light btn-wave btn-sm text-muted waves-effect waves-light"
                >
                  View All
                </a>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table text-nowrap">
                    <thead>
                      <tr>
                        <th className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel1"
                            defaultValue=""
                            aria-label="..."
                          />
                        </th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-center">Amount</th>
                        <th>Status</th>
                        <th>Date Ordered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel02"
                            defaultValue=""
                            aria-label="..."
                            defaultChecked=""
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/faces/1.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div>
                              <span className="d-block fw-medium">
                                Elena smith
                              </span>
                              <span className="d-block fs-11 text-muted">
                                elenasmith387@gmail.com
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>All-Purpose Cleaner</td>
                        <td className="text-center">3</td>
                        <td className="text-center">$9.99</td>
                        <td>
                          <span className="badge bg-primary-transparent">
                            In Progress
                          </span>
                        </td>
                        <td>03,Sep 2024</td>
                        <td>
                          <div className="btn-list">
                            <button className="btn btn-sm btn-icon btn-success-light">
                              <i className="ri-pencil-line" />
                            </button>
                            <button className="btn btn-sm btn-icon btn-danger-light">
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel12"
                            defaultValue=""
                            aria-label="..."
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/faces/12.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div>
                              <span className="d-block fw-medium">
                                Nelson Gold
                              </span>
                              <span className="d-block fs-11 text-muted">
                                noahrussell556@gmail.com
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>Kitchen Knife Set</td>
                        <td className="text-center">4</td>
                        <td className="text-center">$49.99</td>
                        <td>
                          <span className="badge bg-primary1-transparent">
                            Pending
                          </span>
                        </td>
                        <td>26,Jul 2024</td>
                        <td>
                          <div className="btn-list">
                            <button className="btn btn-sm btn-icon btn-success-light">
                              <i className="ri-pencil-line" />
                            </button>
                            <button className="btn btn-sm btn-icon btn-danger-light">
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel42"
                            defaultValue=""
                            aria-label="..."
                            defaultChecked=""
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/faces/6.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div>
                              <span className="d-block fw-medium">
                                Grace Mitchell
                              </span>
                              <span className="d-block fs-11 text-muted">
                                gracemitchell79@gmail.com
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>Velvet Throw Blanket</td>
                        <td className="text-center">2</td>
                        <td className="text-center">$29.99</td>
                        <td>
                          <span className="badge bg-primary2-transparent">
                            Success
                          </span>
                        </td>
                        <td>12,May 2024</td>
                        <td>
                          <div className="btn-list">
                            <button className="btn btn-sm btn-icon btn-success-light">
                              <i className="ri-pencil-line" />
                            </button>
                            <button className="btn btn-sm btn-icon btn-danger-light">
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel32"
                            defaultValue=""
                            aria-label="..."
                            defaultChecked=""
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/faces/14.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div>
                              <span className="d-block fw-medium">
                                Spencer Robin
                              </span>
                              <span className="d-block fs-11 text-muted">
                                leophillips124@gmail.com
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>Aromatherapy Diffuser</td>
                        <td className="text-center">4</td>
                        <td className="text-center">$19.99</td>
                        <td>
                          <span className="badge bg-primary2-transparent">
                            Success
                          </span>
                        </td>
                        <td>15,Aug 2024</td>
                        <td>
                          <div className="btn-list">
                            <button className="btn btn-sm btn-icon btn-success-light">
                              <i className="ri-pencil-line" />
                            </button>
                            <button className="btn btn-sm btn-icon btn-danger-light">
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="checkboxNoLabel2"
                            defaultValue=""
                            aria-label="..."
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="lh-1">
                              <span className="avatar avatar-sm">
                                <img
                                  src="../assets/images/faces/3.jpg"
                                  alt=""
                                />
                              </span>
                            </div>
                            <div>
                              <span className="d-block fw-medium">
                                Chloe Lewis
                              </span>
                              <span className="d-block fs-11 text-muted">
                                chloelewis67@gmail.com
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>Insulated Water Bottle</td>
                        <td className="text-center">2</td>
                        <td className="text-center">$14.99</td>
                        <td>
                          <span className="badge bg-primary3-transparent">
                            Pending
                          </span>
                        </td>
                        <td>11,Oct 2024</td>
                        <td>
                          <div className="btn-list">
                            <button className="btn btn-sm btn-icon btn-success-light">
                              <i className="ri-pencil-line" />
                            </button>
                            <button className="btn btn-sm btn-icon btn-danger-light">
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card custom-card">
              <div className="card-header justify-content-between">
                <div className="card-title">Sales By Country</div>
                <a
                  href="javascript:void(0);"
                  className="btn btn-light btn-wave btn-sm text-muted waves-effect waves-light"
                >
                  View All
                </a>
              </div>
              <div className="card-body">
                <ul className="list-unstyled sales-country-list">
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/us_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            United States
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            31,672
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={90}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: "90%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/italy_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            Italy
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            29,557
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={85}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-primary1 progress-bar-striped progress-bar-animated"
                            style={{ width: "85%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/spain_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            Spain
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            24,562
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={80}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-primary2 progress-bar-striped progress-bar-animated"
                            style={{ width: "80%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/uae_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            Uae
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            21,532
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={75}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-primary3 progress-bar-striped progress-bar-animated"
                            style={{ width: "75%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/argentina_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            Argentina
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            18,753
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={70}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-secondary progress-bar-striped progress-bar-animated"
                            style={{ width: "70%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/china_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            China
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            12,342
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={65}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-info progress-bar-striped progress-bar-animated"
                            style={{ width: "65%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex align-items-start gap-3">
                      <div className="lh-1">
                        <span className="avatar avatar-sm p-1 bg-light border">
                          <img
                            src="../assets/images/flags/french_flag.jpg"
                            alt=""
                          />
                        </span>
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-block fw-medium mb-2 lh-1">
                            French
                          </span>
                          <span className="fs-14 fw-medium d-block lh-1">
                            15,533
                          </span>
                        </div>
                        <div
                          className="progress progress-md p-1"
                          role="progressbar"
                          aria-valuenow={60}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar bg-warning progress-bar-striped progress-bar-animated"
                            style={{ width: "60%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        </>

    )

}