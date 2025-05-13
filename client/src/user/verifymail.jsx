import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const isRequestSent = useRef(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    if (!token || isRequestSent.current) return;

    const verifyEmail = async () => {
      isRequestSent.current = true;
      try {
        console.log('Verification token:', token);
        const response = await axios.get(`https://lavoro-back.onrender.com/users/verify-email?token=${token}`);
        console.log('Backend response:', response.data);

        if (response.status === 200) {
          setAlertMessage('Email verified successfully!');
          setShowAlert(true);
          setTimeout(() => {
            setShowAlert(false);
            navigate('/signin');
          }, 2000);
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setAlertMessage(error.response?.data?.error || 'Failed to verify email. Please try again.');
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          navigate('/signin');
        }, 2000);
      }
    };

    verifyEmail();
  }, [token, navigate]);


  return (
    <>
    </>
  );
}


export default VerifyEmail;
