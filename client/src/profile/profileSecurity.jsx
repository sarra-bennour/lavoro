import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ProfileSecurity = ({ user }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(user.twoFactorEnabled);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    level: "empty",
    message: "Enter a password",
    color: "text-muted",
    progressColor: "bg-light",
    progress: 0
  });

  const validatePassword = (password) => {
    const errors = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordErrors(errors);

    const strengthScore = Object.values(errors).filter(Boolean).length;
    let strength = {
      level: "weak",
      message: "Weak password",
      color: "text-danger",
      progressColor: "bg-danger",
      progress: 33
    };

    const missingCriteria = [];
    if (!errors.length) missingCriteria.push("8+ characters");
    if (!errors.uppercase) missingCriteria.push("uppercase letter");
    if (!errors.lowercase) missingCriteria.push("lowercase letter");
    if (!errors.number) missingCriteria.push("number");
    if (!errors.specialChar) missingCriteria.push("special character");

    if (strengthScore === 5) {
      strength = { 
        level: "strong", 
        message: "Strong password",
        color: "text-success",
        progressColor: "bg-success",
        progress: 100
      };
    } else if (strengthScore >= 3) {
      strength = { 
        level: "medium", 
        message: "Medium strength",
        color: "text-warning",
        progressColor: "bg-warning",
        progress: 66
      };
    } else if (password.length > 0) {
      strength = { 
        level: "weak", 
        message: "Weak password",
        color: "text-danger",
        progressColor: "bg-danger",
        progress: 33
      };
    } else {
      strength = { 
        level: "empty", 
        message: "Enter a password",
        color: "text-muted",
        progressColor: "bg-light",
        progress: 0
      };
    }

    setPasswordStrength(strength);
    return strengthScore === 5;
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePassword(value);
  };

  const handleEnable2FA = async () => {
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No token found");

      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/enable-2fa",
        {},
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      );

      setQrCodeUrl(response.data.qrCodeUrl);
      setShowQRCode(true);
    } catch (err) {
      console.error("Error enabling 2FA:", err);
      setMessage(err.response?.data?.error || "Error enabling 2FA");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No token found");
  
      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/verify-2fa",
        { token },
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      );
  
      setMessage(response.data.message);
      setShowQRCode(false);
      setIs2FAEnabled(true);
    } catch (err) {
      console.error("Error verifying 2FA:", err);
      setMessage(err.response?.data?.error || "Error verifying 2FA");
    }
  };
  
  const handleDisable2FA = async () => {
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No token found");

      const response = await axios.post(
        "https://lavoro-back.onrender.com/profiles/disable-2fa",
        {},
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      );

      setMessage(response.data.message);
      setIs2FAEnabled(false);
    } catch (err) {
      console.error("Error disabling 2FA:", err);
      setMessage(err.response?.data?.error || "Error disabling 2FA");
    }
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("token");
      if (!authToken) throw new Error("No token found");

      if (!currentPassword || !newPassword || !confirmPassword) {
        await Swal.fire({ title: "Error!", text: "All fields are required", icon: "error" });
        return;
      }

      if (newPassword !== confirmPassword) {
        await Swal.fire({ title: "Error!", text: "Passwords don't match", icon: "error" });
        return;
      }

      if (!validatePassword(newPassword)) {
        await Swal.fire({ title: "Error!", text: "Password doesn't meet requirements", icon: "error" });
        return;
      }

      const response = await axios.put(
        "https://lavoro-back.onrender.com/profiles/update-password",
        { currentPassword, newPassword, confirmNewPassword: confirmPassword },
        { headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" }, withCredentials: true }
      );

      if (response.status === 200) {
        await Swal.fire({ title: "Success!", text: "Password updated successfully!", icon: "success" });
        window.location.reload();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      await Swal.fire({
        title: "Error!",
        text: err.response?.data?.message || err.response?.data?.error || err.message || "Error changing password",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane p-0" id="account-settings" role="tabpanel">
      <div className="row gy-3">
        <div className="col-xxl-7">
          <div className="card custom-card shadow-none mb-0">
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap align-items-top mb-4 justify-content-between">
                <div className="w-75">
                  <p className="fs-14 mb-1 fw-medium">Two-Step Verification</p>
                  <p className="fs-12 text-muted mb-0">
                    Enhanced security to prevent unauthorized access
                  </p>
                </div>
                <div
                  className={`toggle toggle-success ${is2FAEnabled ? "on" : "off"} mb-0`}
                  onClick={is2FAEnabled ? handleDisable2FA : handleEnable2FA}
                >
                  <span></span>
                </div>
              </div>

              {showQRCode && (
                <div className="mt-4">
                  <img src={qrCodeUrl} alt="QR Code" className="img-fluid mb-3" style={{ maxWidth: "200px" }} />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 2FA code"
                    className="form-control mb-3"
                  />
                  <button onClick={handleVerify2FA} className="btn btn-primary btn-sm">
                    Verify Code
                  </button>
                </div>
              )}

              {message && (
                <div className="mt-3">
                  <p className={`fs-14 ${message.includes("Error") ? "text-danger" : "text-success"}`}>
                    {message}
                  </p>
                </div>
              )}

              <div className="d-flex align-items-top justify-content-between mt-4">
                <div className="w-100">
                  <p className="fs-14 mb-1 fw-medium">Reset Password</p>
                  <p className="fs-12 text-muted">Password should be min of <b className="text-success">8 digits<sup>*</sup></b>, at least <b className="text-success">One Capital letter<sup>*</sup></b> and <b className="text-success">One Special Character<sup>*</sup></b> included.</p>
                  
                  <div className="mb-2">
                    <label className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      required
                    />
                    
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className={passwordStrength.color}>
                          <strong>Password Strength:</strong> {passwordStrength.message}
                        </small>
                        <small className="text-muted">
                          {newPassword.length > 0 ? `${newPassword.length}/8` : ""}
                        </small>
                      </div>
                      
                      <div className="progress" style={{ height: "4px", backgroundColor: "#f0f0f0" }}>
                        <div 
                          className={`progress-bar ${passwordStrength.progressColor}`}
                          style={{ width: `${passwordStrength.progress}%`, transition: "width 0.3s ease" }}
                          role="progressbar"
                        ></div>
                      </div>
                      
                      <div className="row mt-3 g-2">
                        <div className="col-6">
                          <small className={`d-flex align-items-center ${passwordErrors.length ? "text-success" : "text-danger"}`}>
                            <span className="me-1">{passwordErrors.length ? "✓" : "✗"}</span>
                            <span>8+ characters</span>
                          </small>
                          <small className={`d-flex align-items-center ${passwordErrors.uppercase ? "text-success" : "text-danger"}`}>
                            <span className="me-1">{passwordErrors.uppercase ? "✓" : "✗"}</span>
                            <span>Uppercase letter</span>
                          </small>
                        </div>
                        <div className="col-6">
                          <small className={`d-flex align-items-center ${passwordErrors.lowercase ? "text-success" : "text-danger"}`}>
                            <span className="me-1">{passwordErrors.lowercase ? "✓" : "✗"}</span>
                            <span>Lowercase letter</span>
                          </small>
                          <small className={`d-flex align-items-center ${passwordErrors.number ? "text-success" : "text-danger"}`}>
                            <span className="me-1">{passwordErrors.number ? "✓" : "✗"}</span>
                            <span>Number</span>
                          </small>
                          <small className={`d-flex align-items-center ${passwordErrors.specialChar ? "text-success" : "text-danger"}`}>
                            <span className="me-1">{passwordErrors.specialChar ? "✓" : "✗"}</span>
                            <span>Special character</span>
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button 
                    onClick={handlePasswordReset} 
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSecurity;