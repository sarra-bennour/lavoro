import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import "../../public/assets/libs/sweetalert2/sweetalert2.min.css";

const ForgotPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://lavoro-back.onrender.com/users/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        // Show success Swal alert
        Swal.fire({
          title: "Success!",
          text: "Password reset link has been sent to your email!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          navigate('/signin'); // Navigate after user clicks OK
        });
        setError('');
      } else {
        setError(data.error || 'An error occurred');
        // Show error Swal alert
        Swal.fire({
          title: "Error!",
          text: data.error || 'An error occurred',
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      setError("An error occurred while sending the email.");
      console.error('Error:', err);
      // Show error Swal alert
      Swal.fire({
        title: "Error!",
        text: "An error occurred while sending the email.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="container-lg">
      <div className="row justify-content-center align-items-center authentication authentication-basic h-100">
        <div className="col-xxl-4 col-xl-5 col-lg-5 col-md-6 col-sm-8 col-12">
          <div className="card custom-card my-4">
            <div className="card-body p-5">
              <p className="h5 mb-2 text-center">Forgot Password</p>
              <p className="mb-4 text-muted op-7 fw-normal text-center fs-14">
                Enter your email to reset your password.
              </p>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleForgotPassword}>
                <div className="row gy-3">
                  <div className="col-xl-12">
                    <label htmlFor="email" className="form-label text-default">
                      Email <sup className="fs-12 text-danger">*</sup>
                    </label>
                    <div className="position-relative">
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary">
                    Reset Password
                  </button>
                </div>
              </form>
              <div className="text-center">
                <p className="text-muted mt-3">
                  Remembered your password? <a href="/signin" className="text-primary">Sign In</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;