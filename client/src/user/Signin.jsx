"use client"

import { useState, useEffect } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import GoogleLogin from "./GoogleLogin"
import GitHubLogin from "./GitHubLogin"
import MicrosoftLogin from "./MicrosoftLogin"

function SignIn() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [requires2FA, setRequires2FA] = useState(false)
    const [userId, setUserId] = useState(null)
    const [twoFAToken, setTwoFAToken] = useState("")
    const [show2FAPopup, setShow2FAPopup] = useState(false)
    const navigate = useNavigate();
    

    const Errorstyle = {
        color: "#ff6b6b",
        fontSize: "12px",
        marginTop: "5px",
        width: "100%",
        textAlign: "center",
      }
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get('https://lavoro-back.onrender.com/users/me', {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                        xsrfCookieName: 'XSRF-TOKEN',
                        xsrfHeaderName: 'X-XSRF-TOKEN'
                    });
                    if (response.data) {
                        // Redirect to home or admin dashboard based on role
                        if (response.data.role && response.data.role.RoleName === 'Admin') {
                            navigate('/admin-dashboard');
                        } else {
                            navigate('/profile');
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking authentication:', err);
                localStorage.removeItem("token");
            }
        };

        checkAuthentication();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
    
        try {
          const response = await axios.post(
  "https://lavoro-back.onrender.com/users/signin", 
  formData, 
  {
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
  }
);
    
          if (response.data.requires2FA) {
            setRequires2FA(true)
            setUserId(response.data.userId)
            setShow2FAPopup(true) // Show the 2FA popup
          } else if (response.data.token) {
            localStorage.setItem("token", response.data.token) // Store token in localStorage
    
            // Fetch user info to check role
            const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
              headers: { Authorization: `Bearer ${response.data.token}` },
              withCredentials: true,
              xsrfCookieName: 'XSRF-TOKEN',
              xsrfHeaderName: 'X-XSRF-TOKEN'
            })
    
            // Show success alert
            setAlertMessage("✅ Sign-in successful!")
            setShowAlert(true)
    
            // Redirect after 2 seconds
            setTimeout(() => {
              setShowAlert(false) // Hide the alert
              if (userResponse.data.role && userResponse.data.role.RoleName === "Admin") {
                navigate("/admin-dashboard") // Redirect to admin dashboard
              } else {
                navigate("/profile") // Redirect to home
              }
            }, 2000)
          } else {
            throw new Error("No token received")
          }
        } catch (err) {
          console.error("Error during sign-in:", err.response?.data || err.message)
          setError(err.response?.data?.error || "Email or Password is incorrect.")
        }
      }
    
      const handle2FASubmit = async (e) => {
        e.preventDefault()
    
        try {
          const response = await axios.post(
            "https://lavoro-back.onrender.com/users/verify2FALogin",
            { userId, token: twoFAToken },
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            },
          )
    
          if (response.data.token) {
            localStorage.setItem("token", response.data.token) // Store token in localStorage
    
            // Fetch user info to check role
            const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
              headers: { Authorization: `Bearer ${response.data.token}` },
              withCredentials: true,
              xsrfCookieName: 'XSRF-TOKEN',
              xsrfHeaderName: 'X-XSRF-TOKEN'
            })
    
            // Show success alert
            setAlertMessage("✅ Sign-in successful!")
            setShowAlert(true)
    
            // Redirect after 2 seconds
            setTimeout(() => {
              setShowAlert(false) // Hide the alert
              setShow2FAPopup(false) // Close the 2FA popup
              if (userResponse.data.role && userResponse.data.role.RoleName === "Admin") {
                navigate("/admin-dashboard") // Redirect to admin dashboard
              } else {
                navigate("/profile") // Redirect to home
              }
            }, 2000)
          } else {
            throw new Error("No token received")
          }
        } catch (err) {
          console.error("Error during 2FA verification:", err.response?.data || err.message)
          setError(err.response?.data?.error || "An error occurred during 2FA verification.")
        }
      }
      const handleForgotPassword = () => {
        navigate("/forgot-password", { state: { email: formData.email } })
      }
    
      const CustomAlert = ({ message, onClose }) => {
        return (
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              zIndex: 1000,
              color: "black",
            }}
          >
            <p style={{ margin: "0 0 10px 0" }}>{message}</p>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#5d68e2",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        )
      }
    
      const popupStyles = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "400px",
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        zIndex: 1000,
        color: "black",
      }
    
      const TwoFAPopup = () => (
        <div style={popupStyles}>
          <h2>2FA Verification</h2>
          <p>Please enter your 2FA code</p>
          <form onSubmit={handle2FASubmit} noValidate>
            <div className="input-group">
              <input
                type="text"
                name="twoFAToken"
                placeholder="2FA Code"
                value={twoFAToken}
                onChange={(e) => setTwoFAToken(e.target.value)}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#5d68e2",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Verify
            </button>
          </form>
        </div>
      )
      const back = {
        backgroundColor: "#19191C ",
    };
    
    
      return (
        <div >
            <div className="row authentication authentication-cover-main mx-0">
                <div className="col-xxl-6 col-xl-7">
                    <div className="row justify-content-center align-items-center h-100">
                        <div className="col-xxl-7 col-xl-9 col-lg-6 col-md-6 col-sm-8 col-12">
                            <div className="card custom-card my-auto border">
                                <div className="card-body p-5">
                                    <p className="h5 mb-2 text-center">Sign In</p>
                                    <p className="mb-4 text-muted op-7 fw-normal text-center">
                                        Welcome back!
                                    </p>
                                    <div className="btn-list text-center mt-3">
                                        <button className="btn btn-icon btn-wave btn-primary-light">
                                            <GitHubLogin />
                                        </button>
                                        <button className="btn btn-icon btn-wave btn-primary1-light">
                                            <GoogleLogin />
                                        </button>
                                        <button className="btn btn-icon btn-wave btn-primary2-light">
                                            <MicrosoftLogin />
                                        </button>
                                    </div>
    
                                    <div className="text-center my-3 authentication-barrier">
                                        <span>OR</span>
                                    </div>
                                    <form onSubmit={handleSubmit} noValidate>
                                        <div className="row gy-3">
                                            <div className="col-xl-12">
                                                <label htmlFor="signin-username" className="form-label text-default">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="signin-username"
                                                    placeholder="Email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-xl-12">
                                                <label htmlFor="signin-password" className="form-label text-default d-block">
                                                    Password
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        className="form-control create-password-input"
                                                        id="signin-password"
                                                        placeholder="Password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <span
                                                        className="show-password-button text-muted"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <br />
                                                    <label
                                                        className="form-check-label text-muted fw-normal"
                                                        htmlFor="defaultCheck1"
                                                        onClick={handleForgotPassword}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        Forgot password?
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-grid mt-4">
                                            <button type="submit" className="btn btn-primary">
                                                Sign In
                                            </button>
                                        </div>
                                        {error && <p className="error" style={Errorstyle}>{error}</p>}
                                    </form>
                                    <div className="text-center">
                                        <p className="text-muted mt-3 mb-0">
                                            Don't have an account?{" "}
                                            <a href="/signup" className="text-primary">
                                                Sign Up
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xxl-6 col-xl-5 col-lg-12 d-xl-block d-none px-0" >
                <div className="authentication-cover overflow-hidden" >
    <div className="aunthentication-cover-content d-flex align-items-center justify-content-center h-100">
      <div className="text-center p-4">
      
          {/* Alternative GIF URLs */}
          <img 
            src="./public/signup.png" // Replace with your GIF URL
            alt="Project Management Animation"
            style={{
              width: '500px',
              height: '500px',
              
            }}
          />
      </div>
    </div>
  </div>
</div>
                {show2FAPopup && (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Two-Factor Authentication</h5>
                    <button type="button" className="btn-close" onClick={() => setShow2FAPopup(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p>Enter the 2FA code from your authenticator app:</p>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="2FA Code"
                      value={twoFAToken}
                      onChange={(e) => setTwoFAToken(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShow2FAPopup(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handle2FASubmit} noValidate>
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    
                
            </div>
    
            
            {show2FAPopup }
        </div>
    );
    
    

    }


  


export default SignIn;