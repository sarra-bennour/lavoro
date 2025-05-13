import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './assets/css/custom-navbar.css';
import './assets/css/custom-landing.css';

function Landing() {
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [openDropdowns, setOpenDropdowns] = useState([]);

      const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        // Close all dropdowns when closing the mobile menu
        if (mobileMenuOpen) {
          setOpenDropdowns([]);
        }
      };

      const toggleDropdown = (index, event) => {
        // Prevent default behavior only on mobile
        if (window.innerWidth <= 992) {
          event.preventDefault();

          if (openDropdowns.includes(index)) {
            setOpenDropdowns(openDropdowns.filter(item => item !== index));
          } else {
            setOpenDropdowns([...openDropdowns, index]);
          }
        }
      };

      return (

        <div className="landing-page-wrapper">
          {/* app-header */}
          <header className="app-header sticky">
            {/* Start::main-header-container */}
            <div className="main-header-container container-fluid">
              <div className="d-flex align-items-center justify-content-between w-100 navbar-container">
                {/* Logo and Mobile Menu Toggle */}
                <div className="header-element d-flex align-items-center">
                  {/* Mobile Menu Toggle Button - Only visible on small screens */}
                  <button
                    className="d-lg-none btn btn-icon btn-sm me-3 text-white"
                    onClick={toggleMobileMenu}
                  >
                    <i className={`ri-${mobileMenuOpen ? 'close' : 'menu-3'}-line fs-20`} />
                  </button>

                  {/* Logo */}
                  <div className="horizontal-logo">
                    <a href="index.html" className="header-logo">
                      <img src="/Lavoro (1).png" alt="logo" className="desktop-logo" />
                      <img src="/Lavoro (1).png" alt="logo" className="desktop-white" />
                    </a>
                  </div>
                </div>

                {/* Navigation Menu - Hidden on mobile unless toggled */}
                <nav className={`main-menu-container nav nav-pills ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
                  <ul className="main-menu d-flex">
                    {/* Start::slide */}
                    <li className="slide">
                      <a className="nav-link" href="#home">
                        <span>Home</span>
                      </a>
                    </li>
                    {/* End::slide */}
                    {/* Start::slide */}
                    <li className="slide">
                      <a href="#about" className="nav-link">
                        <span>About</span>
                      </a>
                    </li>
                    {/* End::slide */}
                    {/* Start::slide */}

                    {/* End::slide */}
                    {/* Start::slide */}
                    <li className="slide">
                      <a href="#team" className="nav-link">
                        <span>Team</span>
                      </a>
                    </li>
                    {/* End::slide */}
                    {/* Start::slide */}

                    {/* End::slide */}
                    {/* Start::slide */}

                    {/* End::slide */}
                    {/* Start::slide */}
                    <li className="slide">
                      <a href="#testimonials" className="nav-link">
                        <span>Testimonials</span>
                      </a>
                    </li>
                    {/* End::slide */}
                    {/* Start::slide */}

                    {/* End::slide */}
                  </ul>
                </nav>

                {/* Sign Up Button and Settings Icon */}
                <div className="buttons-group d-flex">
                  <a href="/signin" className="btn  btn-primary1">
                    Sign In
                  </a>

                </div>
              </div>
            </div>
            {/* End::main-header-container */}
          </header>
          {/* /app-header */}
          {/* Start::app-content */}
          <div className="main-content landing-main px-0" style={{ marginTop: '70px' }}>
            {/* Start:: Section-1 */}
            <div className="landing-banner" id="home">
              <section className="section">
                <div className="container main-banner-container pb-lg-0">
                  <div className="row pt-3">
                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-8">
                      <div className="pt-lg-5 pb-4">
                        <div className="mb-3">
                          <h6 className="fw-medium text-fixed-white op-9">Optimized and Accessible</h6>
                        </div>
                        <p className="landing-banner-heading mb-3 text-fixed-white">Manage With Confidence, Deliver With Excellence
                          <br/>
</p>
                        <div className="fs-16 mb-5 text-fixed-white op-7">The best companion to help you stay organized. <br/>An app created to ensure efficiency and productivity.
                        </div>

                        <a href="/signup" className="m-1 btn btn-lg btn-primary1 btn-wave waves-effect waves-light" >
                          Join US
                          <i className="ri-arrow-right-line ms-2 align-middle" />
                        </a>
                      </div>
                    </div>
                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-4 my-auto">
                      <div className="text-end landing-main-image landing-heading-img">
                        <img src="/landing1.png" alt="People joining hands from different frames, symbolizing team collaboration across platforms" className="img-fluid" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            {/* End:: Section-1 */}
            {/* Start:: Section-2 */}
            <section className="section" id="about">
              <div className="container position-relative">
                <div className="text-center">
                  <p className="fs-12 fw-medium text-success mb-1"><span className="landing-section-heading text-primary">GLANCE</span>
                  </p>
                  <h4 className="fw-semibold mb-1 mt-3">Why you choose us ?</h4>
                  <div className="row justify-content-center">
                    <div className="col-xl-7">
                      <p className="text-muted fs-14 mb-5 fw-normal">Our mission is to support you in achieving
                        your goals.</p>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card border shadow-none text-center">
                      <div className="card-body">
                        <div className="mb-4">
                          <span className="avatar avatar-lg bg-primary-transparent svg-primary avatar-rounded border-3 border border-opacity-50 border-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M208,40H48A24,24,0,0,0,24,64V176a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Zm-48,48a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,224Z" /></svg>
                          </span>
                        </div>
                        <h6 className="fw-semibold">AI Features</h6>
                        <p className="text-muted"> With AI-powered insights, you can make data-driven decisions and optimize your workflow effortlessly.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card border shadow-none text-center">
                      <div className="card-body">
                        <div className="mb-4">
                          <span className="avatar avatar-lg bg-primary1-transparent svg-primary1 avatar-rounded border-3 border border-opacity-50 border-primary1">
                            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z" /></svg>
                          </span>
                        </div>
                        <h6 className="fw-semibold">Collaboration and Communication</h6>
                        <p className="text-muted">With communication features, you can ensure a seamless interaction inside your team</p>
                             </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card border shadow-none text-center">
                      <div className="card-body">
                        <div className="mb-4">
                          <span className="avatar avatar-lg bg-primary2-transparent svg-primary2 avatar-rounded border-3 border border-opacity-50 border-primary2">
                            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M64,105V40a8,8,0,0,0-16,0v65a32,32,0,0,0,0,62v49a8,8,0,0,0,16,0V167a32,32,0,0,0,0-62Zm-8,47a16,16,0,1,1,16-16A16,16,0,0,1,56,152Zm80-95V40a8,8,0,0,0-16,0V57a32,32,0,0,0,0,62v97a8,8,0,0,0,16,0V119a32,32,0,0,0,0-62Zm-8,47a16,16,0,1,1,16-16A16,16,0,0,1,128,104Zm104,64a32.06,32.06,0,0,0-24-31V40a8,8,0,0,0-16,0v97a32,32,0,0,0,0,62v17a8,8,0,0,0,16,0V199A32.06,32.06,0,0,0,232,168Zm-32,16a16,16,0,1,1,16-16A16,16,0,0,1,200,184Z" /></svg>
                          </span>
                        </div>
                        <h6 className="fw-semibold">Manage Professionally</h6>
                        <p className="text-muted">Ensure projects successc, with our smart features</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-2 */}
            {/* Start:: Section-3 */}
            <section className="section section-bg" id="expectations">
              <div className="container">
                <div className="row gx-5 mx-0">
                  <div className="col-xl-5 d-flex align-items-center justify-content-center">
                    <div className="home-proving-image">
                      <img src="/management.png" alt="Collaborative management between team members to ensure success" className="img-fluid about-image" style={{borderRadius: '12px', maxHeight: '400px', objectFit: 'cover'}} />
                    </div>
                    <div className="proving-pattern-1" />
                  </div>
                  <div className="col-xl-7 my-auto">
                    <div className="heading-section text-start mb-4">
                      <p className="fs-12 fw-medium text-start text-success mb-1"><span className="landing-section-heading text-primary">ABOUT US</span>
                      </p>
                      <h4 className="mt-3 fw-semibold mb-2">Our Commitment!</h4>
                      <div className="heading-description fs-14">Welcome to Lavoro, where our dedication to delivering a streamlined and efficient project management tool is at the heart of everything we do. Our goal is to provide a solution that makes managing projects easier, helping you stay organized and on track every step of the way.</div>
                    </div>
                    <div className="row gy-3 mb-0">
                      <div className="col-xl-12">
                        <div className="d-flex align-items-top">
                          <div className="me-2 home-prove-svg">
                            <i className="ri-focus-2-fill align-middle text-primary d-inline-block" />
                          </div>
                          <div>
                            <span className="fs-14">
                              <strong>Months of hard work :</strong> Built as part of our academic journey, Lavoro combines the knowledge we've gained with the latest in project management best practices. Though we're just starting, we’ve poured in countless hours to create a tool that helps users manage their tasks effectively.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-12">
                        <div className="d-flex align-items-top">
                          <div className="me-2 home-prove-svg">
                            <i className="ri-focus-2-fill align-middle text-primary1 d-inline-block" />
                          </div>
                          <div>
                            <span className="fs-14">
                              <strong>Dedicated Team:</strong> Our team is made up of dedicated and ambitious individuals, all focused on providing exceptional service and ensuring the success of every project.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-12">
                        <div className="d-flex align-items-top">
                          <div className="me-2 home-prove-svg">
                            <i className="ri-focus-2-fill align-middle text-primary2 d-inline-block" />
                          </div>
                          <div>
                            <span className="fs-14">
                              <strong>Client-Centric Approach:</strong> We understand that every project is unique, which is why Lavoro is designed to be flexible, allowing users to manage their tasks and teams the way that works best for them.
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-3 */}
            {/* Start:: Section-4 */}
            <section className="section" id="services">
              <div className="container">
                <div className="text-center">
                  <p className="fs-12 fw-medium text-success mb-1"><span className="landing-section-heading text-primary">SERVICES</span>
                  </p>
                  <h4 className="fw-semibold mt-3 mb-2">What You Get</h4>
                  <div className="row justify-content-center">
                    <div className="col-xl-7">
                      <p className="text-muted fs-14 mb-5 fw-normal">Our application offers to you</p>
                    </div>
                  </div>
                </div>
                {/* First row of cards */}
                <div className="row mb-5">
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="p-2 border d-inline-block border-primary border-opacity-10 bg-primary-transparent rounded-pill">
                            <span className="avatar avatar-lg avatar-rounded bg-primary svg-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                            </span>
                          </div>
                        </div>
                        <h6 className="fw-semibold">User Friendly Interface</h6>
                        <p className="text-muted mb-0">Our platform is designed to be intuitive, ensuring that anyone, from beginners to experienced managers, can navigate easily and get started without a steep learning curve.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="mb-4">
                            <div className="p-2 border d-inline-block border-primary1 border-opacity-10 bg-primary1-transparent rounded-pill">
                              <span className="avatar avatar-lg avatar-rounded bg-primary1 svg-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <h6 className="fw-semibold">Tailored to Your Needs</h6>
                        <p className="text-muted mb-0">Whether you're managing a single project or an entire portfolio, Lavoro adapts to your business model. Our customizable features help you manage tasks, track progress, and allocate resources with ease.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="mb-4">
                            <div className="p-2 border d-inline-block border-primary2 border-opacity-10 bg-primary2-transparent rounded-pill">
                              <span className="avatar avatar-lg avatar-rounded bg-primary2 svg-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <h6 className="fw-semibold">Collaboration Made Easy</h6>
                        <p className="text-muted mb-0">Communication is key to successful projects. Our integrated team collaboration tools make it effortless to share updates, discuss tasks, and stay on the same page—wherever you are.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second row of cards */}
                <div className="row">
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="p-2 border d-inline-block border-primary3 border-opacity-10 bg-primary3-transparent rounded-pill">
                            <span className="avatar avatar-lg avatar-rounded bg-primary3 svg-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                            </span>
                          </div>
                        </div>
                        <h6 className="fw-semibold">Secure & Scalable</h6>
                        <p className="text-muted mb-0">Security is a top priority. We ensure your data is protected with the highest standards of encryption and compliance. Plus, our platform grows with you—whether you're a startup or an enterprise, we can handle your needs.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="p-2 border d-inline-block border-secondary border-opacity-10 bg-secondary-transparent rounded-pill">
                            <span className="avatar avatar-lg avatar-rounded bg-secondary svg-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                            </span>
                          </div>
                        </div>
                        <h6 className="fw-semibold">Manage Professionally</h6>
                        <p className="text-muted mb-0">Plan your workflow with precision and stay organized at every step. We help you break down complex projects into manageable tasks, set clear priorities, and visualize timelines with ease. </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-4">
                    <div className="card custom-card landing-card">
                      <div className="card-body text-center">
                        <div className="mb-4">
                          <div className="p-2 border d-inline-block border-info border-opacity-10 bg-info-transparent rounded-pill">
                            <span className="avatar avatar-lg avatar-rounded bg-info svg-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} fill="#000000" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" /></svg>
                            </span>
                          </div>
                        </div>
                        <h6 className="fw-semibold">AI Assistance</h6>
                        <p className="text-muted mb-0">We offer intelligent task suggestions, predictive analytics, and smart notifications that help you stay ahead of deadlines.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-4 */}
            {/* Start:: Section-5 */}
            <section className="section landing-Features" id="features">
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-xl-8">
                    <div className="heading-section text-center mb-5">
                      <p className="fs-12 fw-medium text-success mb-1"><span className="landing-section-heading landing-section-heading-dark text-fixed-white">FEATURES</span>
                      </p>
                      <h4 className="text-fixed-white text-center mt-3 fw-medium">Key Features</h4>
                      <div className="fs-14 text-fixed-white text-center op-8 mb-4">
                        Discover the powerful tools that make Lavoro the ultimate project management solution
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-12">
                    <div className="row justify-content-center">
                      {/* User Management Feature */}
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card feature-card bg-white-transparent border-0" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}>
                          <div className="card-body text-center p-4">
                            <div className="feature-icon mb-4 mx-auto">
                              <span className="avatar avatar-lg bg-white-transparent svg-white avatar-rounded border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="#ffffff" viewBox="0 0 256 256">
                                  <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>
                                </svg>
                              </span>
                            </div>
                            <h5 className="text-white fw-bold mb-3" style={{color: '#ffffff !important'}}>User Management</h5>
                            <p className="text-white-50 mb-0">
                              Easily manage user accounts, roles, and permissions. Control access levels and ensure the right people have the right capabilities.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Project Management Feature */}
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card feature-card bg-white-transparent border-0" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}>
                          <div className="card-body text-center p-4">
                            <div className="feature-icon mb-4 mx-auto">
                              <span className="avatar avatar-lg bg-white-transparent svg-white avatar-rounded border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="#ffffff" viewBox="0 0 256 256">
                                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56Zm0,144H40V112H216v88Zm-48-24a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,176Zm16-32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,144ZM60,76a8,8,0,0,1,8-8H84a8,8,0,0,1,0,16H68A8,8,0,0,1,60,76Z"/>
                                </svg>
                              </span>
                            </div>
                            <h5 className="text-white fw-bold mb-3" style={{color: '#ffffff !important'}}>Project Management</h5>
                            <p className="text-white-50 mb-0">
                              Create, organize, and track projects from inception to completion. Set milestones, deadlines, and monitor progress in real-time.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Team Management Feature */}
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card feature-card bg-white-transparent border-0" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}>
                          <div className="card-body text-center p-4">
                            <div className="feature-icon mb-4 mx-auto">
                              <span className="avatar avatar-lg bg-white-transparent svg-white avatar-rounded border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="#ffffff" viewBox="0 0 256 256">
                                  <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,112a8,8,0,0,0-8-8,24,24,0,1,1,23.24-30,8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,112Z"/>
                                </svg>
                              </span>
                            </div>
                            <h5 className="text-white fw-bold mb-3" style={{color: '#ffffff !important'}}>Team Management</h5>
                            <p className="text-white-50 mb-0">
                              Build and organize teams, assign members to projects, and monitor team performance. Optimize workload distribution for maximum efficiency.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Task Management Feature */}
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card feature-card bg-white-transparent border-0" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}>
                          <div className="card-body text-center p-4">
                            <div className="feature-icon mb-4 mx-auto">
                              <span className="avatar avatar-lg bg-white-transparent svg-white avatar-rounded border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="#ffffff" viewBox="0 0 256 256">
                                  <path d="M229.66,58.34l-32-32a8,8,0,0,0-11.32,0l-96,96A8,8,0,0,0,88,128v32a8,8,0,0,0,8,8h32a8,8,0,0,0,5.66-2.34l96-96A8,8,0,0,0,229.66,58.34ZM124.69,152H104V131.31l64-64L188.69,88ZM200,76.69,179.31,56,192,43.31,212.69,64ZM224,120v88a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h88a8,8,0,0,1,0,16H48V208H208V120a8,8,0,0,1,16,0Z"/>
                                </svg>
                              </span>
                            </div>
                            <h5 className="text-white fw-bold mb-3" style={{color: '#ffffff !important'}}>Task Management</h5>
                            <p className="text-white-50 mb-0">
                              Create, assign, and track tasks with ease. Set priorities, deadlines, and dependencies to ensure smooth workflow and timely completion.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Communication Feature */}
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card feature-card bg-white-transparent border-0" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}>
                          <div className="card-body text-center p-4">
                            <div className="feature-icon mb-4 mx-auto">
                              <span className="avatar avatar-lg bg-white-transparent svg-white avatar-rounded border-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} fill="#ffffff" viewBox="0 0 256 256">
                                  <path d="M216,48H40A16,16,0,0,0,24,64V224a8,8,0,0,0,13.12,6.15L72,193.63l144,.37a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,64H216V178H69.77a8,8,0,0,0-4.91,1.69L40,201.86Zm32,72a12,12,0,1,1,12,12A12,12,0,0,1,72,136Zm48,0a12,12,0,1,1,12,12A12,12,0,0,1,120,136Zm48,0a12,12,0,1,1,12,12A12,12,0,0,1,168,136Z"/>
                                </svg>
                              </span>
                            </div>
                            <h5 className="text-white fw-bold mb-3" style={{color: '#ffffff !important'}}>Communication</h5>
                            <p className="text-white-50 mb-0">
                              Seamless communication tools keep everyone connected. Share updates, discuss tasks, and collaborate effectively regardless of location.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-5 */}
            {/* Start:: Section-6 */}
            <section className="section" id="team">
              <div className="container">
                <div className="text-center">
                  <p className="fs-12 fw-medium text-success mb-1"><span className="landing-section-heading text-primary">OUR TEAM</span>
                  </p>
                  <h4 className="fw-semibold mt-3 mb-2">The people who make our organization Successful</h4>
                  <div className="row justify-content-center">
                    <div className="col-xl-7">
                      <p className="text-muted fs-14 mb-5 fw-normal">Our team is made up of real people who are
                        passionate about what they do.</p>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                    <div className="card custom-card team-member text-center">
                      <div className="team-bg-shape primary" />
                      <div className="card-body p-4">
                        <div className="mb-4 lh-1 d-flex gap-2 justify-content-center">
                          <span className="avatar avatar-xl avatar-rounded bg-primary">
                            <img src="/me.jpg" className="card-img" alt="..." />
                          </span>
                        </div>
                        <div className>
                          <p className="mb-2 fs-11 badge bg-primary fw-medium">Director</p>
                          <h6 className="mb-3 fw-semibold">Aya Boukhris</h6>
                          <p className="text-muted fs-12">The Creative Mind – The one who always has a new idea

</p>
                          <div className="d-flex justify-content-center mt-4">
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary-light btn-wave btn-sm waves-effect waves-light"><i className="ri-twitter-x-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary1-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-facebook-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary2-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-instagram-line" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary3-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-linkedin-fill" /></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                   <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                    <div className="card custom-card team-member text-center">
                      <div className="team-bg-shape success" />
                      <div className="card-body p-4">
                        <div className="mb-4 lh-1 d-flex gap-2 justify-content-center">
                          <span className="avatar avatar-xl avatar-rounded bg-success">
                            <img src="/noussa.jpg" className="card-img" alt="..." />
                          </span>
                        </div>
                        <div className>
                          <p className="mb-2 fs-11 badge bg-primary2 fw-medium">Creative Director</p>
                          <h6 className="mb-3 fw-semibold">Nousseiba Kaabi</h6>
                          <p className="text-muted fs-12">The Fixer – Solving problems before you even knew they existed.</p>
                          <div className="d-flex justify-content-center mt-4">
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary-light btn-wave btn-sm waves-effect waves-light"><i className="ri-twitter-x-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary1-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-facebook-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary2-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-instagram-line" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary3-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-linkedin-fill" /></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                    <div className="card custom-card team-member text-center">
                      <div className="team-bg-shape teal" />
                      <div className="card-body p-4">
                        <div className="mb-4 lh-1 d-flex gap-2 justify-content-center">
                          <span className="avatar avatar-xl avatar-rounded bg-teal">
                            <img src="/sarrass.jpg" className="card-img" alt="..." />
                          </span>
                        </div>
                        <div className>
                          <p className="mb-2 fs-11 badge bg-primary1 fw-medium">Board Director</p>
                          <h6 className="mb-3 fw-semibold">Sarra Sahli</h6>
                          <p className="text-muted fs-12">The Sunshine – Ambassador of good vibes and optimism.</p>


                          <div className="d-flex justify-content-center mt-4">
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary-light btn-wave btn-sm waves-effect waves-light"><i className="ri-twitter-x-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary1-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-facebook-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary2-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-instagram-line" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary3-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-linkedin-fill" /></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                    <div className="card custom-card team-member text-center">
                      <div className="team-bg-shape orange" />
                      <div className="card-body p-4">
                        <div className="mb-4 lh-1 d-flex gap-2 justify-content-center">
                          <span className="avatar avatar-xl avatar-rounded bg-orange">
                            <img src="/sarrab.jpg" className="card-img" alt="..." />
                          </span>
                        </div>
                        <div className>
                          <p className="mb-2 fs-11 badge bg-primary3 fw-medium">Board Director</p>
                          <h6 className="mb-3 fw-semibold">Sarra Bennour</h6>
                          <p className="text-muted fs-12">The Strategist – Always three steps ahead, with a backup plan ready.</p>
                          <div className="d-flex justify-content-center mt-4">
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary-light btn-wave btn-sm waves-effect waves-light"><i className="ri-twitter-x-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary1-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-facebook-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary2-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-instagram-line" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary3-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-linkedin-fill" /></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6 col-12">
                    <div className="card custom-card team-member text-center">
                      <div className="team-bg-shape orange" />
                      <div className="card-body p-4">
                        <div className="mb-4 lh-1 d-flex gap-2 justify-content-center">
                          <span className="avatar avatar-xl avatar-rounded bg-orange">
                            <img src="/lili.jpg" className="card-img" alt="..." />
                          </span>
                        </div>
                        <div className>
                          <p className="mb-2 fs-11 badge bg-primary3 fw-medium">Board Director</p>
                          <h6 className="mb-3 fw-semibold">Lilia Jemai</h6>
                          <p className="text-muted fs-12">The Bug Defeater - Errors hate to see her coming</p>
                          <div className="d-flex justify-content-center mt-4">
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary-light btn-wave btn-sm waves-effect waves-light"><i className="ri-twitter-x-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary1-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-facebook-fill" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary2-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-instagram-line" /></a>
                            <a aria-label="anchor" href="javascript:void(0);" className="btn btn-icon btn-primary3-light btn-wave btn-sm ms-2 waves-effect waves-light"><i className="ri-linkedin-fill" /></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-6 */}
            {/* Start:: Section-7 */}

            {/* End:: Section-7 */}

            {/* Start:: Section-9 */}
            <section className="section landing-Features py-4" id="testimonials">
              <div className="container reviews-container">
                <div className="row justify-content-center pb-3">
                  <div className="col-xl-10">
                    <div className="text-center mb-0 mt-4 heading-section">
                      <p className="fs-12 fw-medium text-success mb-1"><span className="landing-section-heading landing-section-heading-dark text-fixed-white">TESTIMONALS</span>
                      </p>
                      <h4 className="mt-3 text-fixed-white mb-1">Discover What People Are Saying About Us</h4>
                      <div className="fs-14 text-fixed-white mb-4 op-8"> Customer reviews, social media and testimonials to discover how is our products or services.</div>
                    </div>
                  </div>
                  <div className="col-xl-10">
                    <div className="swiper pagination-dynamic testimonialSwiperService">
                      <div className="swiper-wrapper">
                        <div className="swiper-slide">
                          <div className="card custom-card overflow-hidden">
                            <div className="card-body">
                              <div className>
                                <span className><sup><i class="ri-double-quotes-l fs-3 me-1 text-fixed-white mt-4" /></sup> An amazing website, rich features, user friendly, and good assistance.

                                </span>
                              </div>
                              <div className="d-flex align-items-center text-end  justify-content-end">
                                <div className="text-warning d-block me-1 fs-10">
                                  <i className="ri-star-fill" />
                                  <i className="ri-star-fill" />
                                  <i className="ri-star-fill" />
                                  <i className="ri-star-fill" />
                                  <i className="ri-star-half-line" />
                                </div>
                                <span>4.3</span>
                              </div>
                            </div>
                            <div className="p-3 bg-white-transparent">
                              <div className="d-flex align-items-center">
                                <span className="avatar rounded-circle me-2">
                                  <img src="./lili.jpg" alt="" className="img-fluid rounded-circle border border-primary1 shadow-sm border-2" />
                                </span>
                                <div>
                                  <p className="mb-0 fw-semibold text-fixed-white">Lilia Jemai</p>
                                  <p className="mb-0 fs-11 fw-normal op-8 text-fixed-white">lilia.jemai@gmail.com</p>
                                </div>
                                <div className="ms-auto fs-12 fw-semibold op-8 text-end">
                                  <div className="btn btn-sm btn-icon rounded-circle btn-white"><i className="ri-twitter-x-line" /></div>
                                  <div className="btn btn-sm btn-icon rounded-circle btn-primary1"><i className="ri-share-line" /></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>


                      </div>
                      <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-9 */}
            {/* Start:: Section-10 */}

            {/* End:: Section-10 */}
            {/* Start:: Section-11 */}
            <section className="section landing-footer text-fixed-white">
              <div className="container">
                <div className="row">
                  <div className="col-md-4 col-sm-6 col-12 mb-md-0 mb-3">
                    <div className="px-4">
                      <p className="fw-medium mb-3"><a href="index.html"><img src="./logo.png" alt="lavoro logo" className="landing-footer-logo" width={200}/></a></p>


                    </div>
                  </div>
                  <div className="col-md-2 col-sm-6 col-12">
                    <div className="px-4">
                      <h6 className="fw-medium mb-3 text-fixed-white">PAGES</h6>
                      <ul className="list-unstyled op-6 fw-normal landing-footer-list">
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Email</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Profile</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Timeline</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Projects</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Contacts</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Portfolio</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-2 col-sm-6 col-12">
                    <div className="px-4">
                      <h6 className="fw-medium text-fixed-white">INFO</h6>
                      <ul className="list-unstyled op-6 fw-normal landing-footer-list">
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Our Team</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Contact US</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">About</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Services</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Blog</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white">Terms &amp; Conditions</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6 col-12">
                    <div className="px-4">
                      <h6 className="fw-medium text-fixed-white">CONTACT</h6>
                      <ul className="list-unstyled fw-normal landing-footer-list">
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white op-6"><i className="ri-home-4-line me-1 align-middle" /> New York, NY 10012, US</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white op-6"><i className="ri-mail-line me-1 align-middle" /> info@fmail.com</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white op-6"><i className="ri-phone-line me-1 align-middle" /> +(555)-1920 1831</a>
                        </li>
                        <li>
                          <a href="javascript:void(0);" className="text-fixed-white op-6"><i className="ri-printer-line me-1 align-middle" /> +(123) 1293 123</a>
                        </li>
                        <li className="mt-3">
                          <p className="mb-2 fw-medium op-8">FOLLOW US ON :</p>
                          <div className="mb-0">
                            <div className="btn-list">
                              <button className="btn btn-sm btn-icon btn-primary-light btn-wave waves-effect waves-light">
                                <i className="ri-facebook-line fw-bold" />
                              </button>
                              <button className="btn btn-sm btn-icon btn-primary1-light btn-wave waves-effect waves-light">
                                <i className="ri-twitter-x-line fw-bold" />
                              </button>
                              <button className="btn btn-sm btn-icon btn-primary2-light btn-wave waves-effect waves-light">
                                <i className="ri-instagram-line fw-bold" />
                              </button>
                              <button className="btn btn-sm btn-icon btn-primary3-light btn-wave waves-effect waves-light">
                                <i className="ri-github-line fw-bold" />
                              </button>
                              <button className="btn btn-sm btn-icon btn-info-light btn-wave waves-effect waves-light">
                                <i className="ri-youtube-line fw-bold" />
                              </button>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* End:: Section-11 */}
            <div className="text-center landing-main-footer py-3">
              <span className="text-muted fs-15"> Copyright © <span id="year" /> <a href="javascript:void(0);" className="text-primary fw-medium"><u>Lavoro</u></a>.
                Designed with <span className="fa fa-heart text-danger" /> by <a href="javascript:void(0);" className="text-primary fw-medium"><u>
                    Astrum</u>
                </a> All
                rights
                reserved
              </span>
            </div>
          </div>
          {/* End::app-content */}
        </div>
      );

  }

export default Landing;